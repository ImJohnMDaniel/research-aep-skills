#!/usr/bin/env node
/**
 * generate_references.cjs — bundled framework reference generation (ADR-0008).
 *
 * Deploys the four AEP frameworks (pinned in framework-sources.json) to a
 * disposable scratch org, extracts compiler-generated SymbolTables and
 * custom-metadata describes for the curated list in reference-classes.json,
 * renders curated markdown per class, and duplicates the results into each
 * consuming skill's references/ folder per the skill mapping.
 *
 * Usage:
 *   node build/generate_references.cjs [flags]
 *
 * Flags:
 *   --devhub <alias>     Dev Hub to create the scratch org against
 *                        (omit to use the default Dev Hub).
 *   --org <alias|user>   Reuse an existing org instead of creating one
 *                        (that org is never deleted by this script).
 *   --skip-deploy        Skip framework deployment (use with --org when the
 *                        frameworks are already deployed there).
 *   --keep-org           Do not delete the scratch org afterward.
 *   --allow-hash-drift   Proceed even if local clones are not at the pinned
 *                        commits (provenance is stamped from the pins, so
 *                        drift makes the stamps lie — prefer fixing the clones).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BUILD_DIR = __dirname;
const REPO_ROOT = path.resolve(BUILD_DIR, '..');
const GENERATED_ROOT = path.join(BUILD_DIR, 'generated', 'references');
const EXEC_OPTS = { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 };

// --- Flag parsing -----------------------------------------------------------
const args = process.argv.slice(2);
const flags = {};
for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
        const key = args[i].slice(2);
        const next = args[i + 1];
        if (next && !next.startsWith('--')) { flags[key] = next; i++; }
        else { flags[key] = true; }
    }
}

function fail(msg) {
    console.error(`\n✖ ${msg}`);
    process.exit(1);
}

// sf CLI wrapper + symbol-rendering primitives from skills/_shared/aep_lib.cjs (issue #22)
const { sfJson, isVisible, signature } = require('../skills/_shared/aep_lib.cjs');
const sf = (command) => sfJson(command);

// --- Load configuration -----------------------------------------------------
const sources = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'framework-sources.json'), 'utf8'));
const curated = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'reference-classes.json'), 'utf8'));
const cloneRoot = path.resolve(BUILD_DIR, '..', sources.localCloneRoot);
const generatedAt = new Date().toISOString();

// --- Step 1: verify local clones against pinned commits ---------------------
function verifySources() {
    console.log('--- Step 1: Verifying local clones against pinned commits ---');
    for (const fw of sources.frameworks) {
        const repoPath = path.join(cloneRoot, fw.name);
        if (!fs.existsSync(path.join(repoPath, '.git'))) {
            fail(`Local clone not found: ${repoPath}`);
        }
        const head = execSync('git rev-parse HEAD', { ...EXEC_OPTS, cwd: repoPath }).trim();
        const dirty = execSync('git status --porcelain', { ...EXEC_OPTS, cwd: repoPath }).trim();
        const matches = head.startsWith(fw.commit) || fw.commit.startsWith(head);
        if (!matches) {
            const msg = `${fw.name} HEAD (${head.substring(0, 7)}) does not match pinned commit ${fw.commit}.`;
            if (flags['allow-hash-drift']) console.warn(`⚠ ${msg} Continuing due to --allow-hash-drift; provenance stamps will use the pinned hash and may be wrong.`);
            else fail(`${msg}\n  Check out the pinned commit (or update framework-sources.json deliberately), or pass --allow-hash-drift.`);
        }
        if (dirty) console.warn(`⚠ ${fw.name} working tree is dirty; generated references reflect deployed source, which may include local edits.`);
        fw.repoPath = repoPath;
        console.log(`✔ ${fw.name} @ ${head.substring(0, 7)}`);
    }
}

// --- Step 2: obtain an org ---------------------------------------------------
function obtainOrg() {
    if (flags.org) {
        console.log(`\n--- Step 2: Reusing org ${flags.org} (will not be deleted) ---`);
        return { username: flags.org, created: false };
    }
    console.log('\n--- Step 2: Creating scratch org (1-day duration) ---');
    const devhubFlag = flags.devhub ? ` --target-dev-hub ${flags.devhub}` : '';
    const result = sf(`org create scratch --definition-file ${path.join(BUILD_DIR, 'reference-build-scratch-def.json')} --duration-days 1 --wait 20${devhubFlag}`);
    console.log(`✔ Created scratch org ${result.username}`);
    return { username: result.username, created: true };
}

// --- Step 3: deploy frameworks in dependency order ---------------------------
function deployFrameworks(org) {
    if (flags['skip-deploy']) {
        console.log('\n--- Step 3: Skipping deployment (--skip-deploy) ---');
        return;
    }
    console.log('\n--- Step 3: Deploying frameworks in dependency order ---');
    const ordered = [...sources.frameworks].sort((a, b) => a.deployOrder - b.deployOrder);
    for (const fw of ordered) {
        process.stdout.write(`Deploying ${fw.name}... `);
        try {
            execSync(`sf project deploy start --target-org ${org.username} --wait 30 --json`, { ...EXEC_OPTS, cwd: fw.repoPath });
            console.log('✔');
        } catch (e) {
            let detail = e.message;
            try { detail = JSON.stringify(JSON.parse(e.stdout).result?.details?.componentFailures || JSON.parse(e.stdout), null, 2); } catch (_) { /* keep raw */ }
            fail(`Deployment of ${fw.name} failed. The pinned commits may not compile together.\n${detail}`);
        }
    }
    console.log('✔ All four frameworks compile together at the pinned commits.');
}

// --- Step 4: extract symbol tables and metadata describes --------------------
function extractSymbols(org) {
    console.log('\n--- Step 4: Extracting SymbolTables ---');
    const results = new Map(); // className -> { framework, symbolTable }
    const missing = [];
    for (const fw of sources.frameworks) {
        const wanted = (curated.frameworks[fw.name] || {}).classes || [];
        if (wanted.length === 0) continue;
        const inList = wanted.map(n => `'${n}'`).join(',');
        const idRows = sf(`data query --query "SELECT Id, Name FROM ApexClass WHERE Name IN (${inList})" --use-tooling-api --target-org ${org.username}`).records;
        const found = new Map(idRows.map(r => [r.Name, r.Id]));
        for (const name of wanted) {
            if (!found.has(name)) { missing.push(`${fw.name}/${name}`); continue; }
            process.stdout.write(`  ${fw.name}/${name}... `);
            const rows = sf(`data query --query "SELECT SymbolTable FROM ApexClass WHERE Id = '${found.get(name)}'" --use-tooling-api --target-org ${org.username}`).records;
            const table = rows[0] && rows[0].SymbolTable;
            if (!table) { missing.push(`${fw.name}/${name} (no SymbolTable)`); console.log('no symbol table'); continue; }
            results.set(name, { framework: fw, symbolTable: table });
            console.log('✔');
        }
    }
    return { results, missing };
}

function extractMetadataTypes(org) {
    console.log('\n--- Step 5: Describing custom metadata types ---');
    const results = new Map(); // typeName -> { framework, describe }
    const missing = [];
    for (const fw of sources.frameworks) {
        const wanted = (curated.frameworks[fw.name] || {}).metadataTypes || [];
        for (const typeName of wanted) {
            process.stdout.write(`  ${fw.name}/${typeName}... `);
            try {
                const describe = sf(`sobject describe --sobject ${typeName} --target-org ${org.username}`);
                results.set(typeName, { framework: fw, describe });
                console.log('✔');
            } catch (e) {
                missing.push(`${fw.name}/${typeName}`);
                console.log('not found');
            }
        }
    }
    return { results, missing };
}

// --- Step 6: render markdown --------------------------------------------------
function provenance(fw, subject) {
    return `<!-- GENERATED FILE - do not edit by hand.\n     Source: ${fw.repo} @ ${fw.commit} (${subject})\n     Generated: ${generatedAt} by build/generate_references.cjs (ADR-0008) -->\n`;
}

function renderTableSection(table, depth) {
    const h = '#'.repeat(depth);
    let md = '';
    const decl = (table.tableDeclaration && table.tableDeclaration.modifiers) || [];
    const lineage = [];
    if (table.parentClass) lineage.push(`extends \`${table.parentClass}\``);
    if (table.interfaces && table.interfaces.length) lineage.push(`implements \`${table.interfaces.join('`, `')}\``);
    md += `${decl.length ? '`' + decl.join(' ') + '`' : ''}${decl.length && lineage.length ? ' — ' : ''}${lineage.join(', ')}\n\n`;

    const ctors = (table.constructors || []).filter(c => isVisible(c.modifiers));
    if (ctors.length) {
        md += `${h} Constructors\n\n`;
        ctors.forEach(c => { md += `- \`${signature(c, false)}\`\n`; });
        md += '\n';
    }
    // SymbolTables list a property and its backing variable separately — dedupe by name.
    const seenProps = new Set();
    const props = [...(table.properties || []), ...(table.variables || [])]
        .filter(p => isVisible(p.modifiers))
        .filter(p => seenProps.has(p.name) ? false : seenProps.add(p.name));
    if (props.length) {
        md += `${h} Properties\n\n`;
        props.forEach(p => { md += `- \`${(p.modifiers || []).join(' ')}${(p.modifiers || []).length ? ' ' : ''}${p.type} ${p.name}\`\n`; });
        md += '\n';
    }
    const methods = (table.methods || []).filter(m => isVisible(m.modifiers));
    if (methods.length) {
        md += `${h} Methods\n\n`;
        methods.forEach(m => { md += `- \`${signature(m, true)}\`\n`; });
        md += '\n';
    }
    return md;
}

function renderClass(name, fw, table) {
    let md = provenance(fw, `class ${name}`);
    md += `# ${name}\n\n**Framework:** ${fw.name}\n\n`;
    md += renderTableSection(table, 2);
    const inners = (table.innerClasses || []).filter(t => isVisible((t.tableDeclaration || {}).modifiers));
    if (inners.length) {
        md += `## Inner Types\n\n`;
        for (const inner of inners) {
            md += `### ${name}.${inner.name}\n\n`;
            md += renderTableSection(inner, 4);
        }
    }
    return md;
}

function renderMetadataType(typeName, fw, describe) {
    let md = provenance(fw, `custom metadata type ${typeName}`);
    md += `# ${typeName}\n\n**Framework:** ${fw.name}\n**Label:** ${describe.label}\n\n## Fields\n\n`;
    md += '| Field | Type | Label | References |\n| --- | --- | --- | --- |\n';
    for (const f of describe.fields) {
        const refs = (f.referenceTo || []).join(', ');
        md += `| \`${f.name}\` | ${f.type}${f.length ? `(${f.length})` : ''} | ${f.label || ''} | ${refs} |\n`;
    }
    md += '\n';
    return md;
}

// --- Step 7: write canonical output and duplicate into skills -----------------
function writeOutputs(classResults, mdtResults) {
    console.log('\n--- Step 6: Writing canonical references ---');
    const fileIndex = new Map(); // name -> { frameworkName, fileName, content }
    const perFramework = new Map();

    for (const [name, { framework, symbolTable }] of classResults) {
        const content = renderClass(name, framework, symbolTable);
        fileIndex.set(name, { frameworkName: framework.name, fileName: `${name}.md`, content });
    }
    for (const [name, { framework, describe }] of mdtResults) {
        const content = renderMetadataType(name, framework, describe);
        fileIndex.set(name, { frameworkName: framework.name, fileName: `${name}.md`, content });
    }

    for (const [name, entry] of fileIndex) {
        const dir = path.join(GENERATED_ROOT, entry.frameworkName);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, entry.fileName), entry.content);
        if (!perFramework.has(entry.frameworkName)) perFramework.set(entry.frameworkName, []);
        perFramework.get(entry.frameworkName).push(entry.fileName);
    }

    for (const fw of sources.frameworks) {
        const files = (perFramework.get(fw.name) || []).sort();
        if (!files.length) continue;
        const manifest = `${provenance(fw, 'framework reference manifest')}# ${fw.name} references\n\n- Source: ${fw.repo}\n- Commit: \`${fw.commit}\`\n- Generated: ${generatedAt}\n\n## Files\n\n${files.map(f => `- [${f}](${f})`).join('\n')}\n`;
        fs.writeFileSync(path.join(GENERATED_ROOT, fw.name, 'MANIFEST.md'), manifest);
    }
    console.log(`✔ Canonical set written to ${path.relative(REPO_ROOT, GENERATED_ROOT)}`);

    console.log('\n--- Step 7: Duplicating into skill references/ folders ---');
    const unmapped = [];
    for (const [skill, names] of Object.entries(curated.skillMapping)) {
        for (const name of names) {
            const entry = fileIndex.get(name);
            if (!entry) { unmapped.push(`${skill}: ${name}`); continue; }
            const dest = path.join(REPO_ROOT, 'skills', skill, 'references', entry.frameworkName);
            fs.mkdirSync(dest, { recursive: true });
            fs.writeFileSync(path.join(dest, entry.fileName), entry.content);
        }
        console.log(`✔ ${skill}`);
    }
    return unmapped;
}

// --- Step 8: cleanup -----------------------------------------------------------
function cleanup(org) {
    if (!org.created) return;
    if (flags['keep-org']) { console.log(`\nKeeping scratch org ${org.username} (--keep-org).`); return; }
    console.log(`\n--- Step 8: Deleting scratch org ${org.username} ---`);
    try {
        sf(`org delete scratch --target-org ${org.username} --no-prompt`);
        console.log('✔ Deleted.');
    } catch (e) {
        console.warn(`⚠ Could not delete scratch org ${org.username}: ${e.message}. It expires in 1 day regardless.`);
    }
}

// --- Main ----------------------------------------------------------------------
async function run() {
    let org = null;
    try {
        verifySources();
        org = obtainOrg();
        deployFrameworks(org);
        const { results: classResults, missing: missingClasses } = extractSymbols(org);
        const { results: mdtResults, missing: missingMdts } = extractMetadataTypes(org);
        const unmapped = writeOutputs(classResults, mdtResults);

        console.log('\n--- Summary ---');
        console.log(`Classes rendered:        ${classResults.size}`);
        console.log(`Metadata types rendered: ${mdtResults.size}`);
        if (missingClasses.length) console.warn(`⚠ Missing classes (fix reference-classes.json or the deploy): ${missingClasses.join(', ')}`);
        if (missingMdts.length) console.warn(`⚠ Missing metadata types: ${missingMdts.join(', ')}`);
        if (unmapped.length) console.warn(`⚠ Skill-mapping entries with no generated file: ${unmapped.join('; ')}`);
        if (!missingClasses.length && !missingMdts.length && !unmapped.length) console.log('✔ Complete — review the diff, then commit the generated references.');
    } catch (e) {
        console.error(`\n✖ ${e.message}`);
        process.exitCode = 1;
    } finally {
        if (org) cleanup(org);
    }
}

run();

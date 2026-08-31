#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Project-local, self-gitignoring cache (see issue #7 / ADR-0002). The cache
// is this script's private storage: agents consume the summaries this script
// PRINTS, never the cache files directly — some platforms' agent file tools
// refuse to read git-ignored paths, but a script's own fs access (and its
// stdout) is unrestricted everywhere.
function ensureAepCacheDir(subpath) {
    const aepDir = path.join(process.cwd(), '.aep');
    const dir = path.join(aepDir, 'cache', subpath);
    fs.mkdirSync(dir, { recursive: true });
    const selfIgnore = path.join(aepDir, '.gitignore');
    if (!fs.existsSync(selfIgnore)) fs.writeFileSync(selfIgnore, '*\n');
    return dir;
}

function isVisible(modifiers) {
    const mods = modifiers || [];
    return !mods.includes('private') && !mods.includes('testMethod');
}

function signature(m, withReturn) {
    const mods = (m.modifiers || []).join(' ');
    const params = (m.parameters || []).map(p => `${p.type} ${p.name}`).join(', ');
    const ret = withReturn && m.returnType ? `${m.returnType} ` : '';
    return `${mods ? mods + ' ' : ''}${ret}${m.name}(${params})`;
}

// Compact API summary printed to stdout — this is the supported read path.
function renderSymbolSummary(name, table) {
    const lines = [`## ${name}`];
    const decl = (table.tableDeclaration && table.tableDeclaration.modifiers) || [];
    const lineage = [];
    if (table.parentClass) lineage.push(`extends ${table.parentClass}`);
    if (table.interfaces && table.interfaces.length) lineage.push(`implements ${table.interfaces.join(', ')}`);
    if (decl.length || lineage.length) lines.push(`${decl.join(' ')}${decl.length && lineage.length ? ' — ' : ''}${lineage.join(', ')}`);
    (table.constructors || []).filter(c => isVisible(c.modifiers))
        .forEach(c => lines.push(`- ctor: ${signature(c, false)}`));
    const seenProps = new Set();
    [...(table.properties || []), ...(table.variables || [])]
        .filter(p => isVisible(p.modifiers))
        .filter(p => seenProps.has(p.name) ? false : seenProps.add(p.name))
        .forEach(p => lines.push(`- prop: ${p.type} ${p.name}`));
    (table.methods || []).filter(m => isVisible(m.modifiers))
        .forEach(m => lines.push(`- ${signature(m, true)}`));
    (table.innerClasses || []).filter(ic => isVisible((ic.tableDeclaration || {}).modifiers))
        .forEach(ic => lines.push(`- inner type: ${name}.${ic.name}`));
    return lines.join('\n');
}

/**
 * Usage:
 * node learn_symbols.cjs [ClassName1] [ClassName2] ...
 * node learn_symbols.cjs --pattern UCMN_*
 * node learn_symbols.cjs --all
 */

async function run() {
    try {
        const args = process.argv.slice(2);
        let fetchAll = args.includes('--all');
        let refresh = args.includes('--refresh');
        let patterns = args.filter(a => !a.startsWith('--'));
        let globPattern = args.find(a => args[args.indexOf(a) - 1] === '--pattern');

        if (args.length === 0) {
            console.log('Usage:');
            console.log('  node learn_symbols.cjs <ClassName1> [ClassName2] ...');
            console.log('  node learn_symbols.cjs --pattern <RegexPattern>');
            console.log('  node learn_symbols.cjs --all');
            console.log('  Add --refresh to re-fetch symbol tables that are already stored locally.');
            return;
        }

        // 1. Determine local Apex classes
        const sfdxProject = JSON.parse(fs.readFileSync('sfdx-project.json', 'utf8'));
        const localClassNames = new Set();
        
        for (const dir of sfdxProject.packageDirectories) {
            const dirPath = dir.path;
            if (fs.existsSync(dirPath)) {
                const findFiles = (currentPath) => {
                    const files = fs.readdirSync(currentPath);
                    for (const file of files) {
                        const fullPath = path.join(currentPath, file);
                        if (fs.statSync(fullPath).isDirectory()) {
                            findFiles(fullPath);
                        } else if (file.endsWith('.cls')) {
                            localClassNames.add(path.basename(file, '.cls'));
                        }
                    }
                };
                findFiles(dirPath);
            }
        }

        // 2. Get current org info
        const orgInfo = JSON.parse(execSync('sf org display --json', { encoding: 'utf8' }));
        const orgId = orgInfo.result.id;
        console.log(`Querying org: ${orgId} (${orgInfo.result.alias || orgInfo.result.username})`);

        // 3. Construct Query. Local classes are excluded in JavaScript below —
        // embedding them in a NOT IN clause produces invalid SOQL when the
        // project has no classes and can exceed query-length limits on large
        // projects.
        let whereClause = null;

        if (globPattern) {
            // Convert glob-style wildcard '*' to SOQL LIKE wildcard '%'
            const likePattern = globPattern.replace(/\*/g, '%');
            whereClause = `Name LIKE '${likePattern}'`;
        } else if (patterns.length > 0) {
            whereClause = `Name IN (${patterns.map(p => `'${p}'`).join(',')})`;
        } else if (fetchAll) {
            console.log('Warning: The --all flag can be slow or fail on orgs with many classes. Consider using the --pattern flag for better performance.');
        }

        console.log('Fetching ApexClass metadata from org...');
        const soql = `SELECT Id, Name FROM ApexClass${whereClause ? ` WHERE ${whereClause}` : ''}`;
        const queryResult = JSON.parse(execSync(`sf data query --query "${soql}" --use-tooling-api --json`, { encoding: 'utf8' }));

        let classesToQuery = queryResult.result.records.filter(r => !localClassNames.has(r.Name));

        console.log(`Found ${classesToQuery.length} matching classes in org that are NOT in the local project.`);

        if (classesToQuery.length === 0) return;

        // 4. Create storage directory (project-local, self-gitignoring)
        const storageDir = ensureAepCacheDir(path.join('org-symbols', orgId));

        // 5. Query SymbolTable for each class
        for (const apexClass of classesToQuery) {
            try {
                const outputPath = path.join(storageDir, `${apexClass.Name}.json`);
                if (!refresh && fs.existsSync(outputPath)) {
                    const cached = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
                    console.log(`\n${renderSymbolSummary(apexClass.Name, cached)}`);
                    console.log(`(from cache; use --refresh to re-fetch)`);
                    continue;
                }
                process.stdout.write(`Fetching SymbolTable for ${apexClass.Name}... `);
                const symbolResult = JSON.parse(execSync(`sf data query --query "SELECT SymbolTable FROM ApexClass WHERE Id = '${apexClass.Id}'" --use-tooling-api --json`, { encoding: 'utf8' }));
                
                const symbolTable = symbolResult.result.records[0].SymbolTable;
                if (symbolTable) {
                    fs.writeFileSync(outputPath, JSON.stringify(symbolTable, null, 2));
                    console.log('Done.');
                    console.log(`\n${renderSymbolSummary(apexClass.Name, symbolTable)}`);
                } else {
                    console.log('No SymbolTable available.');
                }
            } catch (e) {
                console.log(`Failed: ${e.message}`);
            }
        }

        console.log(`\nFinished. Symbol tables stored in ${storageDir}`);

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

run();

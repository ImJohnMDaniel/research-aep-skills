#!/usr/bin/env node
/**
 * generate_package_inventory.cjs — committed name inventory for one dependency
 * package (tier-2 knowledge; see the onboard-project SKILL.md).
 *
 * Usage:
 *   node generate_package_inventory.cjs <package-name> <PREFIX> [flags]
 *   node generate_package_inventory.cjs <package-name> <namespace> --namespace [flags]
 *
 * Flags:
 *   --namespace            Treat the second argument as a managed-package
 *                          namespace instead of a class prefix.
 *   --declared <string>    The version string from sfdx-project.json, VERBATIM
 *                          (the refresh-trigger snapshot). Recorded in provenance.
 *   --out <dir>            Output directory (default: aep-references/<package-name>).
 *   --target-org <alias>   Org to query (default: the project's default org).
 *
 * Names only, grouped by layer inferred from naming conventions — existence
 * awareness, not API detail. Membership detection relies on strict prefix
 * naming (the only membership signal in non-namespaced unlocked packages);
 * convention violations yield an incomplete inventory, which is reported.
 */

const fs = require('fs');
const path = require('path');
const { parseFlags, getPlural, sfJson } = require('../../_shared/aep_lib.cjs');

// --- Args --------------------------------------------------------------------
const packageName = process.argv[2];
const marker = process.argv[3];
const flags = parseFlags(process.argv.slice(4));

if (!packageName || !marker) {
    console.error('Usage: node generate_package_inventory.cjs <package-name> <PREFIX|namespace> [--namespace] [--declared "<version>"] [--out <dir>] [--target-org <alias>]');
    process.exit(1);
}

const isNamespace = !!flags.namespace;
const orgFlag = flags['target-org'] ? ` --target-org ${flags['target-org']}` : '';
const outDir = flags.out || path.join('aep-references', packageName);
const declared = flags.declared || '(not provided)';

// sf CLI + pluralization come from skills/_shared/aep_lib.cjs (issue #22).
const sf = (command) => sfJson(command, { orgFlag });

function run() {
    // --- Org + installed-version provenance -----------------------------------
    const orgInfo = sf('org display');
    let installed = 'not found in installed packages';
    try {
        const rows = sf('package installed list');
        const hit = rows.find(r => (r.SubscriberPackageName || '').toLowerCase() === packageName.toLowerCase());
        if (hit) installed = `${hit.SubscriberPackageVersionNumber} (${hit.SubscriberPackageVersionId})`;
    } catch (e) {
        installed = `unavailable (${e.message.split('\n')[0]})`;
    }

    // --- Class names -----------------------------------------------------------
    console.log(`Querying classes for ${packageName} (${isNamespace ? 'namespace' : 'prefix'} "${marker}")...`);
    let classNames;
    if (isNamespace) {
        const rows = sf(`data query --query "SELECT Name FROM ApexClass WHERE NamespacePrefix = '${marker}'" --use-tooling-api`).records;
        classNames = rows.map(r => r.Name).sort();
    } else {
        // SOQL LIKE is case-insensitive; keep the JS post-filter case-insensitive
        // too (Apex class names are case-insensitive identifiers org-side).
        const prefixLower = `${marker.toLowerCase()}_`;
        const rows = sf(`data query --query "SELECT Name FROM ApexClass WHERE NamespacePrefix = null AND Name LIKE '${marker}%'" --use-tooling-api`).records;
        classNames = rows.map(r => r.Name).filter(n => n.toLowerCase().startsWith(prefixLower)).sort();
    }

    // --- SObject names -----------------------------------------------------------
    console.log('Querying SObjects...');
    const allSObjects = sf('sobject list --sobject all');
    const objectPrefix = (isNamespace ? `${marker}__` : `${marker}_`).toLowerCase();
    const packageObjects = allSObjects.filter(n => n.toLowerCase().startsWith(objectPrefix)).sort();

    // Reverse-plural map over ALL org SObjects, for Domain/Selector annotation:
    // e.g. plural "Users" -> "User"; both full-base and prefix-stripped keys.
    const pluralMap = new Map();
    for (const obj of allSObjects) {
        const base = obj.replace(/__(c|pc|mdt|e|Share|History|ChangeEvent)$/, '');
        pluralMap.set(getPlural(obj), obj);
        const underscore = base.indexOf('_');
        if (underscore > 0) pluralMap.set(getPlural(base.substring(underscore + 1) + (obj.slice(base.length) || '')), obj);
    }

    // --- Grouping by naming convention -----------------------------------------
    const groups = { Selectors: [], Domains: [], Services: [], Interfaces: [], Tests: [], Other: [] };
    for (const name of classNames) {
        const core = isNamespace ? name : name.substring(marker.length + 1);
        const annotate = (stem) => pluralMap.has(stem) ? `${name} (${pluralMap.get(stem)})` : name;
        if (/(_UT|_Test|Test|Tests)$/.test(core)) groups.Tests.push(name);
        else if (/^I[A-Z]/.test(core)) groups.Interfaces.push(name);
        else if (core.endsWith('Selector')) groups.Selectors.push(annotate(core.slice(0, -'Selector'.length)));
        else if (/Service(Impl)?$/.test(core)) groups.Services.push(name);
        else if (pluralMap.has(core)) groups.Domains.push(annotate(core));
        else groups.Other.push(name);
    }

    // --- Render ------------------------------------------------------------------
    const generatedAt = new Date().toISOString();
    let md = `<!-- GENERATED FILE - do not edit by hand.\n`;
    md += `     Package: ${packageName} (${isNamespace ? `namespace ${marker}__` : `prefix ${marker}_`})\n`;
    md += `     Declared dependency (sfdx-project.json): ${declared}\n`;
    md += `     Installed version at generation: ${installed}\n`;
    md += `     Org: ${orgInfo.id}\n`;
    md += `     Generated: ${generatedAt} by onboard-project/generate_package_inventory.cjs -->\n\n`;
    md += `# ${packageName} — package inventory\n\n`;
    md += `Names only — existence awareness. Fetch API details on demand via the \`learn-org-symbol-table\` / \`learn-org-metadata\` skills. Layer grouping and SObject annotations are inferred from naming conventions (best effort).\n\n`;

    const section = (title, items) => items.length ? `## ${title} (${items.length})\n\n${items.map(i => `- ${i}`).join('\n')}\n\n` : '';
    md += section('SObjects', packageObjects);
    md += section('Selectors', groups.Selectors);
    md += section('Domains (likely)', groups.Domains);
    md += section('Services', groups.Services);
    md += section('Interfaces', groups.Interfaces);
    md += section('Other Classes', groups.Other);
    md += section('Test Classes', groups.Tests);

    if (!classNames.length && !packageObjects.length) {
        md += `> No classes or SObjects matched ${isNamespace ? 'namespace' : 'prefix'} \`${marker}\`. Either the package is not deployed to this org, the marker is wrong, or the package does not follow the naming convention — report this to the developer.\n`;
    }

    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, 'INVENTORY.md');
    fs.writeFileSync(outPath, md);

    console.log(`\n✔ ${outPath}`);
    console.log(`  Classes: ${classNames.length} (selectors ${groups.Selectors.length}, likely domains ${groups.Domains.length}, services ${groups.Services.length}, interfaces ${groups.Interfaces.length}, tests ${groups.Tests.length}, other ${groups.Other.length})`);
    console.log(`  SObjects: ${packageObjects.length}`);
    console.log(`  Declared: ${declared} | Installed: ${installed}`);
    if (!classNames.length && !packageObjects.length) {
        console.warn(`⚠ Nothing matched "${marker}" — inventory written with a warning; verify the marker and deployment, and report to the developer.`);
        process.exitCode = 2;
    }
    console.log('\nCommit the aep-references/ folder so the whole team shares this inventory.');
}

try {
    run();
} catch (e) {
    console.error(`✖ ${e.message}`);
    process.exit(1);
}

#!/usr/bin/env node
/**
 * create_service.cjs — scaffolds the full service complement (issue #13):
 * facade, interface, implementation, exception, unit-test stub, and the
 * ApplicationFactory_ServiceBinding__mdt record.
 *
 * Usage:
 *   node create_service.cjs <CapabilityName> --prefix=<ProjectPrefix>
 *
 *   <CapabilityName> is the capability the service aggregates (e.g.
 *   QuoteGeneration -> ACME_QuoteGenerationService). It may be passed with or
 *   without the project prefix; a DIFFERENT prefix is refused (guardrail).
 *
 * Create-only semantics (never modifies existing files); no deployment
 * (ADR-0005 — the agent deploys explicitly after completing the
 * implementation).
 */

const fs = require('fs');
const path = require('path');
const { parseFlags, createFileIfMissing, apexMetaXml } = require('../../_shared/aep_lib.cjs');

const capabilityArg = process.argv[2];
const flags = parseFlags(process.argv.slice(3));
const appPrefix = flags.prefix;

if (!capabilityArg) {
    console.error('Error: CapabilityName is required. Usage: node create_service.cjs <CapabilityName> --prefix=<ProjectPrefix>');
    process.exit(1);
}
if (!appPrefix) {
    console.error('Error: --prefix is required (the project prefix from the AEP Conventions section of the project context file). A capability name carries no prefix to infer from.');
    process.exit(1);
}

// ARCHITECTURAL GUARDRAIL (Single-Ownership Principle / naming canon): a
// service may only be created under this project's own prefix. Services
// cannot be extended cross-package, so there is no injection alternative to
// point at — a foreign prefix is simply refused.
let capability = capabilityArg;
const prefixMatch = capability.match(/^([A-Za-z0-9]+)_/);
if (prefixMatch) {
    if (prefixMatch[1] !== appPrefix) {
        console.error(`ARCHITECTURAL GUARDRAIL: "${capabilityArg}" carries prefix "${prefixMatch[1]}", which is not this project's prefix ("${appPrefix}").`);
        console.error(`Under the naming canon, that name would claim another package's identity. Create services only under this project's prefix.`);
        process.exit(1);
    }
    capability = capability.substring(appPrefix.length + 1);
}
capability = capability.replace(/Service$/i, ''); // tolerate "...Service" input

// --- Derive the five class names -------------------------------------------------
const names = {
    facade: `${appPrefix}_${capability}Service`,
    iface: `${appPrefix}_I${capability}Service`,
    impl: `${appPrefix}_${capability}ServiceImpl`,
    exception: `${appPrefix}_${capability}ServiceException`,
    test: `${appPrefix}_${capability}ServiceTest`
};

// 40-char limit: refuse rather than truncate — truncation would desynchronize
// the facade/interface/impl/exception family stems. ServiceException is the
// binding constraint.
const over = Object.values(names).filter(n => n.length > 40);
if (over.length) {
    const maxCapability = 40 - appPrefix.length - 1 - 'ServiceException'.length;
    console.error(`Error: the following derived names exceed the 40-character Apex class-name limit:`);
    over.forEach(n => console.error(`  - ${n} (${n.length})`));
    console.error(`With prefix "${appPrefix}", the capability name may be at most ${maxCapability} characters (the ServiceException suffix is the binding constraint). Shorten the capability name.`);
    process.exit(1);
}
if (capability.includes('__') || !capability.length) {
    console.error(`Error: "${capability}" is not a valid capability name.`);
    process.exit(1);
}

// --- Project layout ----------------------------------------------------------------
function run() {
    const sfdxProject = JSON.parse(fs.readFileSync('sfdx-project.json', 'utf8'));
    const defaultDir = sfdxProject.packageDirectories.find(d => d.default).path;
    const apiVersion = sfdxProject.sourceApiVersion;

    const assetsDir = path.join(__dirname, '..', 'assets');
    const servicesDir = path.join(defaultDir, 'main', 'classes', 'services');
    const testDir = path.join(defaultDir, 'test', 'classes', 'services');
    const bindingDir = path.join(defaultDir, 'main', 'schema', 'customMetadata', 'applicationFactoryBindings', 'serviceBindings');
    [servicesDir, testDir, bindingDir].forEach(d => fs.mkdirSync(d, { recursive: true }));

    const fill = (template) => fs.readFileSync(path.join(assetsDir, template), 'utf8')
        .replace(/{{ClassName}}/g, names.facade)
        .replace(/{{InterfaceName}}/g, names.iface)
        .replace(/{{ImplClassName}}/g, names.impl)
        .replace(/{{ExceptionClassName}}/g, names.exception)
        .replace(/{{TestClassName}}/g, names.test);

    console.log(`--- Creating service complement for capability "${capability}" (${appPrefix}) ---`);
    let changed = false;
    const artifacts = [
        [path.join(servicesDir, `${names.facade}.cls`), 'ServiceTemplate.cls'],
        [path.join(servicesDir, `${names.iface}.cls`), 'InterfaceTemplate.cls'],
        [path.join(servicesDir, `${names.impl}.cls`), 'ServiceImplTemplate.cls'],
        [path.join(servicesDir, `${names.exception}.cls`), 'ServiceExceptionTemplate.cls'],
        [path.join(testDir, `${names.test}.cls`), 'TestTemplate.cls']
    ];
    for (const [target, template] of artifacts) {
        changed = createFileIfMissing(target, fill(template)) || changed;
        const metaPath = target + '-meta.xml';
        if (!fs.existsSync(metaPath)) fs.writeFileSync(metaPath, apexMetaXml('ApexClass', apiVersion));
    }

    const bindingPath = path.join(bindingDir, `ApplicationFactory_ServiceBinding.${names.iface}.md-meta.xml`);
    changed = createFileIfMissing(bindingPath, fill('BindingTemplate.xml')) || changed;

    if (changed) {
        console.log('\nGeneration complete. No deployment was performed — complete the implementation (the facade/interface/impl carry commented guidance; the test is a stub pending the AEP testing guidance), then deploy the created paths explicitly (see SKILL.md, \'Deployment\').');
    } else {
        console.log('\nNo changes were made.');
    }
}

try {
    run();
} catch (e) {
    console.error(`Error: ${e.message}`);
    process.exit(1);
}

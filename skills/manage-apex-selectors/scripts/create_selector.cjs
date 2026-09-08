#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const {
    parseFlags, getPlural, validateIdentifier, enforceLimit,
    isSupportedByMetadataRelationship, ownershipGuardrail,
    createFileIfMissing, apexMetaXml,
    parseSObjectFieldList, replaceSObjectFieldList
} = require('../../_shared/aep_lib.cjs');

const sObjectName = process.argv[2];
const flags = parseFlags(process.argv.slice(3));
const isUpdateMode = !!flags['update-fields'];

let explicitFields = flags.fields ? flags.fields.split(",") : null;
let appPrefix = flags.prefix;

if (!sObjectName) {
    console.error("Error: SObject name is required.");
    process.exit(1);
}

if (isUpdateMode && explicitFields) {
    console.error("Error: --fields cannot be combined with --update-fields. The update mode merges into the existing declared contract; use --add=<fields> or --add-all to append, or edit getSObjectFieldList() directly to redeclare the contract wholesale.");
    process.exit(1);
}

// If --prefix is not provided, try to infer it from the SObject name.
if (!appPrefix) {
    if (sObjectName.includes('_') && (sObjectName.endsWith('__c') || sObjectName.endsWith('__mdt') || sObjectName.endsWith('__e'))) {
        appPrefix = sObjectName.split('_')[0];
        console.log(`--prefix flag not provided. Inferred prefix "${appPrefix}" from SObject name.`);
    } else {
        // For standard objects or objects without a clear prefix, default to empty.
        appPrefix = "";
    }
}

// ARCHITECTURAL GUARDRAIL (Single-Ownership Principle, ADR-0007): a Selector
// may be created only by the SObject's owning package.
const guardrail = ownershipGuardrail({
    sObjectName, appPrefix,
    confirmOwnership: !!flags['confirm-ownership'],
    layer: 'Selector', injectionPattern: 'Selector Method Injection'
});
if (guardrail.refused) {
    guardrail.messages.forEach(m => console.error(m));
    process.exit(1);
}

// Naming, guardrail, and file helpers come from skills/_shared/aep_lib.cjs
// (issue #22); see test/aep_lib.test.cjs for their behavior.
function sanitizeName(name) {
    // No longer need to remove suffixes here as getPlural handles them
    return name;
}

// The generated getSObjectFieldList() is the selector's "field list contract
// to the org" (see xdocs/adr/0004): fields guaranteed available on every
// query. The default contract excludes types that would inflate the heap on
// every query — those are selected per query method via fflib_QueryFactory.
const MAX_DEFAULT_CONTRACT_FIELDS = 40;

function isContractEligibleOrgField(field) {
    if (field.calculated) return false;                                // formula fields
    if (field.type === 'base64') return false;                         // blobs
    if (field.type === 'textarea' && field.length > 255) return false; // long / rich text areas
    return true;
}

function isContractEligibleLocalField(fieldFileContent) {
    if (/<formula>/.test(fieldFileContent)) return false;
    const typeMatch = fieldFileContent.match(/<type>([\s\S]*?)<\/type>/);
    const type = typeMatch ? typeMatch[1].trim() : '';
    return type !== 'LongTextArea' && type !== 'Html';
}

// Org describe (via the learn-org-metadata cache) merged with local field metadata —
// the same sources for creation and for --update-fields (issue #28).
function gatherFieldSources(defaultDir) {
    console.log(`Querying org for field list for ${sObjectName}...`);
    const orgInfo = JSON.parse(execSync(`sf org display --json`, { encoding: 'utf8' }).toString()).result;
    const learnScriptPath = path.join(__dirname, '../../learn-org-metadata/scripts/learn_metadata.cjs');
    execSync(`node ${learnScriptPath} ${sObjectName}`);

    const orgMetadataPath = path.join(process.cwd(), '.aep', 'cache', 'org-metadata', orgInfo.id, 'sobjects', `${sObjectName}.json`);
    const orgMetadata = JSON.parse(fs.readFileSync(orgMetadataPath, 'utf8'));

    const orgFieldNames = orgMetadata.fields.filter(isContractEligibleOrgField).map(f => f.name);

    const localFieldsPath = path.join(defaultDir, 'main', 'schema', 'objects', sObjectName, 'fields');
    let localFieldNames = [];
    if (fs.existsSync(localFieldsPath)) {
        const localFieldFiles = fs.readdirSync(localFieldsPath).filter(f => f.endsWith('.field-meta.xml'));
        for (const file of localFieldFiles) {
            const fileContent = fs.readFileSync(path.join(localFieldsPath, file), 'utf8');
            const match = fileContent.match(/<fullName>([\s\S]*?)<\/fullName>/);
            if (match && match[1] && isContractEligibleLocalField(fileContent)) {
                localFieldNames.push(match[1].trim());
            }
        }
    }
    const eligibleFields = [...new Set([...orgFieldNames, ...localFieldNames])];
    return { orgMetadata, eligibleFields, localFieldNames };
}

// --update-fields (issue #28, ADR-0004): merge/report semantics. The declared
// contract is preserved verbatim; the mode only detects contract-eligible fields
// missing from it and appends them on explicit request. Never wholesale-regenerates,
// never removes (a deleted field cannot hide — SObjectField tokens stop compiling).
function runUpdateFields(selectorPath, className, defaultDir) {
    if (!fs.existsSync(selectorPath)) {
        console.error(`Error: no selector found at ${selectorPath}.`);
        console.error(`If the selector does not exist yet, run this script without --update-fields to create it. If it exists at a non-standard path, reconcile the field list manually per SKILL.md.`);
        process.exit(1);
    }

    const content = fs.readFileSync(selectorPath, 'utf8');
    const parsed = parseSObjectFieldList(content, sObjectName);
    if (!parsed.ok) {
        console.error(`REFUSED: getSObjectFieldList() in ${selectorPath} does not match the generated shape (${parsed.reason}).`);
        console.error(`The method has been restructured, so a mechanical rewrite could destroy deliberate logic. Reconcile the field list contract manually per SKILL.md — nothing was modified.`);
        process.exit(1);
    }

    const declaredFields = parsed.fields.map(f => f.field);
    const declaredLower = new Set(declaredFields.map(f => f.toLowerCase()));
    const { orgMetadata, eligibleFields, localFieldNames } = gatherFieldSources(defaultDir);
    const missingFields = eligibleFields.filter(f => !declaredLower.has(f.toLowerCase()));

    console.log(`\nField list contract for ${className} (${sObjectName}): ${declaredFields.length} field(s) declared.`);
    if (missingFields.length === 0) {
        console.log(`The contract is current: every contract-eligible field is already declared. No changes were made.`);
        return;
    }
    console.log(`Contract-eligible fields NOT in the contract (${missingFields.length}): ${missingFields.join(', ')}`);

    // Resolve what to append. Default is report-only: widening a deliberately
    // curated contract requires an explicit --add/--add-all.
    let fieldsToAdd = null;
    if (flags['add-all']) {
        fieldsToAdd = missingFields;
    } else if (flags.add && flags.add !== true) {
        fieldsToAdd = [];
        const orgFieldsByLower = new Map(orgMetadata.fields.map(f => [f.name.toLowerCase(), f]));
        const localByLower = new Map(localFieldNames.map(f => [f.toLowerCase(), f]));
        for (const requested of flags.add.split(',').map(f => f.trim()).filter(f => f.length)) {
            const lower = requested.toLowerCase();
            if (declaredLower.has(lower)) {
                console.log(` - ${requested}: already in the contract, skipped.`);
                continue;
            }
            const orgField = orgFieldsByLower.get(lower);
            const localName = localByLower.get(lower);
            if (!orgField && !localName) {
                console.error(`Error: --add field "${requested}" was not found on ${sObjectName} in the org or in local field metadata. No changes were made.`);
                process.exit(1);
            }
            if (orgField && !isContractEligibleOrgField(orgField)) {
                console.warn(`WARNING: ${orgField.name} is excluded from default contracts (formula, long/rich text area, or blob). Adding it anyway — an explicit --add is a deliberate contract declaration (ADR-0004).`);
            }
            fieldsToAdd.push(orgField ? orgField.name : localName); // canonical casing
        }
    }

    if (fieldsToAdd === null) {
        console.log(`\nReport-only run: no changes were made. Re-run with --add=<comma-separated fields> (or --add-all) to append; the declared contract is always preserved, never regenerated.`);
        return;
    }
    if (fieldsToAdd.length === 0) {
        console.log(`\nNothing to append. No changes were made.`);
        return;
    }

    const newContract = [...declaredFields, ...fieldsToAdd];
    if (newContract.length > MAX_DEFAULT_CONTRACT_FIELDS) {
        console.warn(`WARNING: the contract now declares ${newContract.length} fields, exceeding the recommended maximum of ${MAX_DEFAULT_CONTRACT_FIELDS}. An explicitly declared contract is honored verbatim (ADR-0004), but consider whether every query needs all of these — per-query fields belong in newQueryFactory().selectField(...).`);
    }

    const replaced = replaceSObjectFieldList(content, sObjectName, newContract);
    if (!replaced.ok) {
        console.error(`REFUSED: ${replaced.reason}. Nothing was modified.`);
        process.exit(1);
    }
    fs.writeFileSync(selectorPath, replaced.content);
    console.log(`\nAppended ${fieldsToAdd.length} field(s) to ${selectorPath}: ${fieldsToAdd.join(', ')}`);
    console.log(`The contract now declares ${newContract.length} field(s). No deployment was performed — deploy the modified class explicitly (see SKILL.md, 'Deployment').`);
}

async function run() {
    try {
        const assetsDir = path.join(__dirname, '..', 'assets');
        const selectorTemplateContent = fs.readFileSync(path.join(assetsDir, 'SelectorTemplate.cls'), 'utf8');
        const interfaceTemplateContent = fs.readFileSync(path.join(assetsDir, 'InterfaceTemplate.cls'), 'utf8');
        const testTemplateContent = fs.readFileSync(path.join(assetsDir, 'TestTemplate.cls'), 'utf8');
        const bindingTemplateContent = fs.readFileSync(path.join(assetsDir, 'BindingTemplate.xml'), 'utf8');

        const sfdxProject = JSON.parse(fs.readFileSync("sfdx-project.json", "utf8"));
        const defaultDir = sfdxProject.packageDirectories.find(d => d.default).path;
        const apiVersion = sfdxProject.sourceApiVersion || '67.0'; // Default to a recent API version if not found

        const baseSanitized = sanitizeName(sObjectName);
        let pluralSanitized = getPlural(baseSanitized);

        // If a prefix is used, ensure it's not duplicated in the pluralized name.
        if (appPrefix && pluralSanitized.startsWith(appPrefix + '_')) {
            pluralSanitized = pluralSanitized.substring(appPrefix.length + 1);
        }
        
        // Conditionally add prefix to avoid leading underscore
        const selectorNameBase = appPrefix ? `${appPrefix}_${pluralSanitized}Selector` : `${pluralSanitized}Selector`;
        const interfaceNameBase = appPrefix ? `${appPrefix}_I${pluralSanitized}Selector` : `I${pluralSanitized}Selector`;

        const className = enforceLimit(selectorNameBase);
        const interfaceName = enforceLimit(interfaceNameBase);
        const testClassName = enforceLimit(selectorNameBase, "Test");

        let bindingName = appPrefix ? `${appPrefix}_${baseSanitized}` : baseSanitized;
        if (appPrefix && baseSanitized.startsWith(appPrefix + '_')) {
            bindingName = baseSanitized;
        }
        bindingName = bindingName.replace(/__/g, '_');
        const bindingFileName = `ApplicationFactory_SelectorBinding.${bindingName}.md-meta.xml`;

        // Validate all generated names before proceeding
        validateIdentifier(className);
        validateIdentifier(interfaceName);
        validateIdentifier(testClassName);

        const paths = {
            selector: path.join(defaultDir, "main", "classes", "selectors", `${className}.cls`),
            interface: path.join(defaultDir, "main", "classes", "selectors", `${interfaceName}.cls`),
            binding: path.join(defaultDir, "main", "schema", "customMetadata", "applicationFactoryBindings", "selectorBindings", bindingFileName),
            test: path.join(defaultDir, "test", "classes", "selectors", `${testClassName}.cls`)
        };

        if (isUpdateMode) {
            runUpdateFields(paths.selector, className, defaultDir);
            return;
        }

        Object.values(paths).forEach(p => {
            const dir = path.dirname(p);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        });

        // --- Field Generation ---
        if (!explicitFields) {
            console.log(`No --fields flag found.`);
            const { orgMetadata, eligibleFields } = gatherFieldSources(defaultDir);
            let curatedFields = eligibleFields;

            if (curatedFields.length > MAX_DEFAULT_CONTRACT_FIELDS) {
                const hasNameField = orgMetadata.fields.some(f => f.name === 'Name');
                console.warn(`WARNING: ${curatedFields.length} contract-eligible fields found for ${sObjectName}, exceeding the recommended maximum of ${MAX_DEFAULT_CONTRACT_FIELDS}.`);
                console.warn(`The selector will be created with ${hasNameField ? 'Id and Name' : 'Id'} only. Declare the field list contract explicitly by re-running with --fields=<comma-separated list>, or add fields to getSObjectFieldList() afterward.`);
                curatedFields = hasNameField ? ['Id', 'Name'] : ['Id'];
            } else {
                console.log(`Found ${curatedFields.length} contract-eligible fields (formula, long/rich text area, and blob fields are excluded from the default contract).`);
            }
            explicitFields = curatedFields;
        }

        const fieldList = explicitFields ? explicitFields.map(f => `            ${sObjectName}.${f}`).join(",\n") : `            ${sObjectName}.Id,\n            ${sObjectName}.Name`;
        
        const supportsMR = isSupportedByMetadataRelationship(sObjectName);
        const bindingSObjectValue = supportsMR ? `<value xsi:type="xsd:string">${sObjectName}</value>` : `<value xsi:nil="true"/>`;
        const bindingSObjectAlternateValue = supportsMR ? `<value xsi:nil="true"/>` : `<value xsi:type="xsd:string">${sObjectName}</value>`;

        const selectorTemplate = selectorTemplateContent
            .replace(/{{ClassName}}/g, className)
            .replace(/{{InterfaceName}}/g, interfaceName)
            .replace(/{{SObjectName}}/g, sObjectName)
            .replace(/[ \t]*{{SObjectFieldList}}/g, fieldList); // entries carry their own indent — strip the placeholder's, or the first entry double-indents
        const interfaceTemplate = interfaceTemplateContent
            .replace(/{{InterfaceName}}/g, interfaceName)
            .replace(/{{SObjectName}}/g, sObjectName);
        const testTemplate = testTemplateContent
            .replace(/{{ClassName}}/g, className)
            .replace(/{{TestClassName}}/g, testClassName)
            .replace(/{{SObjectName}}/g, sObjectName);
        const bindingTemplate = bindingTemplateContent
            .replace(/{{ClassName}}/g, className)
            .replace(/{{BindingSObjectValue}}/g, bindingSObjectValue)
            .replace(/{{BindingSObjectAlternateValue}}/g, bindingSObjectAlternateValue);

        console.log(`Processing selector artifacts for ${sObjectName}:`);

        let changed = false;
        changed |= createFileIfMissing(paths.selector, selectorTemplate);
        changed |= createFileIfMissing(paths.interface, interfaceTemplate);
        changed |= createFileIfMissing(paths.test, testTemplate);

        if (!fs.existsSync(paths.binding)) {
            fs.writeFileSync(paths.binding, bindingTemplate);
            console.log(` - Created: ${paths.binding}`);
            changed = true;
        }

        ["selector", "interface", "test"].forEach(key => {
            const metaPath = paths[key] + "-meta.xml";
            if (!fs.existsSync(metaPath)) {
                fs.writeFileSync(metaPath, apexMetaXml("ApexClass", apiVersion));
            }
        });

        if (changed) {
            console.log("\nGeneration complete. No deployment was performed — complete the implementation, then deploy the created paths explicitly (see SKILL.md, 'Deployment').");
        } else {
            console.log("\nNo changes were made.");
        }
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

run();

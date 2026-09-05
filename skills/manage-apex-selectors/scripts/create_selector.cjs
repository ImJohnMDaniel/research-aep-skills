#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const {
    parseFlags, getPlural, validateIdentifier, enforceLimit,
    isSupportedByMetadataRelationship, ownershipGuardrail,
    createFileIfMissing, apexMetaXml
} = require('../../_shared/aep_lib.cjs');

const sObjectName = process.argv[2];
const flags = parseFlags(process.argv.slice(3));

let explicitFields = flags.fields ? flags.fields.split(",") : null;
let appPrefix = flags.prefix;

if (!sObjectName) {
    console.error("Error: SObject name is required.");
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

        Object.values(paths).forEach(p => {
            const dir = path.dirname(p);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        });

        // --- Field Generation ---
        if (!explicitFields) {
            console.log(`No --fields flag found. Querying org for field list for ${sObjectName}...`);
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
            let curatedFields = [...new Set([...orgFieldNames, ...localFieldNames])];

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
            .replace(/{{SObjectFieldList}}/g, fieldList);
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

#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const sObjectName = process.argv[2];

// Parse custom flags
const args = process.argv.slice(3);
const flags = {};
for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
        let key = arg.slice(2);
        let value = true; // Default to boolean true

        const nextArg = args[i + 1];

        // Case 1: --key=value
        if (key.includes('=')) {
            const eqIndex = key.indexOf('=');
            value = key.substring(eqIndex + 1);
            key = key.substring(0, eqIndex);
            
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);

        // Case 2: --key value
        } else if (nextArg && !nextArg.startsWith('--')) {
            value = nextArg;
            i++; 
        }
        
        flags[key] = value;
    }
}

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

function getPlural(name) {
    // Correctly handle standard suffixes before pluralizing
    const suffixes = ["__c", "__pc", "__mdt", "__e", "__Share", "__History", "__ChangeEvent"];
    let baseName = name;
    let suffix = "";

    for (const s of suffixes) {
        if (name.endsWith(s)) {
            baseName = name.slice(0, -s.length);
            suffix = s;
            break;
        }
    }

    let pluralBase;
    if (baseName.endsWith("y")) {
        pluralBase = baseName.slice(0, -1) + "ies";
    } else if (baseName.endsWith("s") || baseName.endsWith("sh") || baseName.endsWith("ch") || baseName.endsWith("x") || baseName.endsWith("z")) {
        pluralBase = baseName + "es";
    } else {
        pluralBase = baseName + "s";
    }

    // Domain classes are just plural, keep original suffix
    return pluralBase;
}

function sanitizeName(name) {
    // No longer need to remove suffixes here as getPlural handles them
    return name;
}

function validateIdentifier(name) {
    if (name.includes("__")) {
        throw new Error(`Generated name "${name}" is invalid because it contains a double underscore. Please check the script's naming logic.`);
    }
    if (name.length > 40) {
        // This is a separate check from enforceLimit, more of a hard stop
        throw new Error(`Generated name "${name}" exceeds the 40-character limit for Apex class names.`);
    }
}

function enforceLimit(name, suffix = "") {
    const limit = 40;
    const testSuffix = suffix === "Test" ? "Test" : "";
    if (name.length + testSuffix.length <= limit) return name + testSuffix;
    const parts = name.split("_");
    const prefix = parts[0] + "_";
    const remainder = name.substring(prefix.length);
    const availableSpace = limit - prefix.length - testSuffix.length;
    return prefix + remainder.substring(0, availableSpace) + testSuffix;
}

function isSupportedByMetadataRelationship(name) {
    if (name.endsWith("__c") || name.endsWith("__pc")) return true;
    const unsupported = ["User", "PermissionSet", "PermissionSetGroup"];
    if (unsupported.includes(name)) return false;
    if (name.endsWith("Share")) return false;
    return true;
}

function updateFile(filePath, content, templateIfMissing) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, templateIfMissing);
        console.log(` - Created: ${filePath}`);
        return true;
    }
    const existingContent = fs.readFileSync(filePath, "utf8");
    if (existingContent.includes(content.trim())) {
        console.log(` - Up to date: ${filePath}`);
        return false;
    }
    if (filePath.endsWith(".cls") || filePath.endsWith(".trigger")) {
        const lastBraceIndex = existingContent.lastIndexOf("}");
        if (lastBraceIndex !== -1) {
            const updated = existingContent.substring(0, lastBraceIndex) + "\n" + content + "\n" + existingContent.substring(lastBraceIndex);
            fs.writeFileSync(filePath, updated);
            console.log(` - Updated: ${filePath}`);
            return true;
        }
    }
    return false;
}

async function run() {
    try {
        const assetsDir = path.join(__dirname, '..', 'assets');
        const domainTemplateContent = fs.readFileSync(path.join(assetsDir, 'DomainTemplate.cls'), 'utf8');
        const interfaceTemplateContent = fs.readFileSync(path.join(assetsDir, 'InterfaceTemplate.cls'), 'utf8');
        const testTemplateContent = fs.readFileSync(path.join(assetsDir, 'TestTemplate.cls'), 'utf8');
        const triggerTemplateContent = fs.readFileSync(path.join(assetsDir, 'TriggerTemplate.trigger'), 'utf8');
        const bindingTemplateContent = fs.readFileSync(path.join(assetsDir, 'BindingTemplate.xml'), 'utf8');

        console.log("--- Step 1: Live Verification of Base Dependencies ---");
        const learnScriptPath = path.join(__dirname, '../../learn-org-symbol-table/scripts/learn_symbols.cjs');

        try {
            // As per our discussion, this step utilizes the learn-org-symbol-table skill to ensure
            // the base AT4DX interfaces exist in the org before we try to implement them.
            console.log("Verifying IApplicationSObjectDomain...");
            execSync(`node ${learnScriptPath} IApplicationSObjectDomain`, { stdio: 'pipe' });
            console.log("✔ Verified base dependency IApplicationSObjectDomain.");
        } catch (e) {
            console.error('CRITICAL: Failed to verify base dependency IApplicationSObjectDomain. Ensure the AT4DX and fflib-apex-common packages are installed in the target org.');
            console.error(e.stderr ? e.stderr.toString() : e.toString());
            process.exit(1);
        }
        console.log("--- Verification Complete ---");

        const sfdxProject = JSON.parse(fs.readFileSync("sfdx-project.json", "utf8"));
        const defaultDir = sfdxProject.packageDirectories.find(d => d.default).path;
        const apiVersion = sfdxProject.sourceApiVersion;

        const baseSanitized = sanitizeName(sObjectName);
        let pluralSanitized = getPlural(baseSanitized);

        // If a prefix is used, ensure it's not duplicated in the pluralized name.
        if (appPrefix && pluralSanitized.startsWith(appPrefix + '_')) {
            pluralSanitized = pluralSanitized.substring(appPrefix.length + 1);
        }

        // Conditionally add prefix to avoid leading underscore
        const domainNameBase = appPrefix ? `${appPrefix}_${pluralSanitized}` : pluralSanitized;
        const interfaceNameBase = appPrefix ? `${appPrefix}_I${pluralSanitized}` : `I${pluralSanitized}`;

        const className = enforceLimit(domainNameBase);
        const interfaceName = enforceLimit(interfaceNameBase);
        const testClassName = enforceLimit(domainNameBase, "Test");
        const triggerName = enforceLimit(domainNameBase);

        let bindingName = appPrefix ? `${appPrefix}_${baseSanitized}` : baseSanitized;
        if (appPrefix && baseSanitized.startsWith(appPrefix + '_')) {
            bindingName = baseSanitized;
        }
        bindingName = bindingName.replace(/__/g, '_');
        const bindingFileName = `ApplicationFactory_DomainBinding.${bindingName}.md-meta.xml`;

        // Validate all generated names before proceeding
        validateIdentifier(className);
        validateIdentifier(interfaceName);
        validateIdentifier(testClassName);
        validateIdentifier(triggerName);

        const paths = {
            domain: path.join(defaultDir, "main", "classes", "domains", `${className}.cls`),
            interface: path.join(defaultDir, "main", "classes", "domains", `${interfaceName}.cls`),
            binding: path.join(defaultDir, "main", "schema", "customMetadata", "applicationFactoryBindings", "domainBindings", bindingFileName),
            trigger: path.join(defaultDir, "main", "schema", "triggers", `${triggerName}.trigger`),
            test: path.join(defaultDir, "test", "classes", "domains", `${testClassName}.cls`)
        };

        Object.values(paths).forEach(p => {
            const dir = path.dirname(p);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        });

        const newInstanceBlock = `    public static ${interfaceName} newInstance(List<${sObjectName}> records)
    {
        return (${interfaceName}) Application.Domain.newInstance(records);
    }

    public static ${interfaceName} newInstance(Set<Id> recordIds)
    {
        return (${interfaceName}) Application.Domain.newInstance(recordIds);
    }`;
        const constructorClassBlock = `    public class Constructor
        implements fflib_SObjectDomain.IConstructable
    {
        public fflib_SObjectDomain construct(List<SObject> sObjectList)
        { 
            return new ${className}(sObjectList);
        }
    }`;
        const triggerHandlerBlock = `    fflib_SObjectDomain.triggerHandler(${className}.class);`;

        const supportsMR = isSupportedByMetadataRelationship(sObjectName);
        const bindingSObjectValue = supportsMR ? `<value xsi:type="xsd:string">${sObjectName}</value>` : `<value xsi:nil="true"/>`;
        const bindingSObjectAlternateValue = supportsMR ? `<value xsi:nil="true"/>` : `<value xsi:type="xsd:string">${sObjectName}</value>`;

        const domainTemplate = domainTemplateContent
            .replace(/{{ClassName}}/g, className)
            .replace(/{{InterfaceName}}/g, interfaceName)
            .replace(/{{SObjectName}}/g, sObjectName);
        const interfaceTemplate = interfaceTemplateContent
            .replace(/{{InterfaceName}}/g, interfaceName);
        const testTemplate = testTemplateContent
            .replace(/{{TestClassName}}/g, testClassName)
            .replace(/{{SObjectName}}/g, sObjectName)
            .replace(/{{ClassName}}/g, className);
        const triggerTemplate = triggerTemplateContent
            .replace(/{{TriggerName}}/g, triggerName)
            .replace(/{{SObjectName}}/g, sObjectName)
            .replace(/{{ClassName}}/g, className);            
        const bindingTemplate = bindingTemplateContent
            .replace(/{{ClassName}}/g, className)
            .replace(/{{BindingSObjectValue}}/g, bindingSObjectValue)
            .replace(/{{BindingSObjectAlternateValue}}/g, bindingSObjectAlternateValue);

        console.log(`--- Step 2: Creating/Updating Domain Artifacts for ${sObjectName} ---`);

        let changed = false;
        changed |= updateFile(paths.domain, "", domainTemplate);
        // if (fs.existsSync(paths.domain)) updateFile(paths.domain, constructorClassBlock, domainTemplate);

// TODO: Review these and are they still needed
        changed |= updateFile(paths.interface, "", interfaceTemplate);
        changed |= updateFile(paths.test, "", testTemplate);
        changed |= updateFile(paths.trigger, "", triggerTemplate);

        if (!fs.existsSync(paths.binding)) {
            fs.writeFileSync(paths.binding, bindingTemplate);
            console.log(` - Created: ${paths.binding}`);
            changed = true;
        }

        ["domain", "interface", "test", "trigger"].forEach(key => {
            const metaPath = paths[key] + "-meta.xml";
            if (!fs.existsSync(metaPath)) {
                const type = key === "trigger" ? "ApexTrigger" : "ApexClass";
                fs.writeFileSync(metaPath, `<?xml version="1.0" encoding="UTF-8"?>
<${type} xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>${apiVersion}</apiVersion>
    <status>Active</status>
</${type}>`);
            }
        });

        if (changed && !flags['no-deploy']) {
            console.log("\nDeploying changes...");
            try {
                const deployOutput = execSync("sf project deploy start --ignore-conflicts --json", { encoding: 'utf8' });
                const deployResult = JSON.parse(deployOutput);
                if (deployResult.status === 0) {
                    console.log("✔ Deployment Succeeded.");
                } else {
                    console.error("✖ Deployment Failed. Details:");
                    console.error(JSON.stringify(deployResult.result, null, 2));
                    process.exit(1);
                }
            } catch (error) {
                console.error("✖ Deployment command failed to execute.");
                try {
                    const errorResult = JSON.parse(error.stdout);
                    console.error(JSON.stringify(errorResult.result || errorResult, null, 2));
                } catch (parseError) {
                    console.error("Raw error output:", error.stdout || error.message);
                }
                process.exit(1);
            }
        } else if (changed) {
            console.log("\nSkipping deployment due to --no-deploy flag.");
        } else {
            console.log("\nNo changes detected. Skipping deployment.");
        }
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

run();

#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const sObjectName = process.argv[2];
const appPrefix = process.argv[3] || "EEORA";

// Parse custom flags
const args = process.argv.slice(4);
const flags = {};
for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
        const cleanArg = arg.slice(2);
        if (cleanArg.includes('=')) {
            const eqIndex = cleanArg.indexOf('=');
            const key = cleanArg.substring(0, eqIndex);
            let value = cleanArg.substring(eqIndex + 1);
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
            flags[key] = value;
        } else {
            flags[cleanArg] = true;
        }
    }
}
const explicitFields = flags.fields ? flags.fields.split(",") : null;

if (!sObjectName) {
    console.error("Error: SObject name is required.");
    process.exit(1);
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

    // Special handling for __Share which becomes Shares
    if (suffix === "__Share") {
        return baseName + "Shares";
    }

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
    let existingContent = fs.readFileSync(filePath, "utf8");
    
    // Check if we are updating the field list specifically
    if (content.includes("getSObjectFieldList")) {
        const fieldListRegex = /public List<Schema.SObjectField> getSObjectFieldList\(\s*\{([\s\S]*?)\}/;
        if (fieldListRegex.test(existingContent)) {
            const updatedContent = existingContent.replace(fieldListRegex, content.trim());
            if (updatedContent !== existingContent) {
                fs.writeFileSync(filePath, updatedContent);
                console.log(` - Updated field list: ${filePath}`);
                return true;
            }
            console.log(` - Field list up to date: ${filePath}`);
            return false;
        }
    }

    if (existingContent.includes(content.trim())) {
        console.log(` - Up to date: ${filePath}`);
        return false;
    }

    if (filePath.endsWith(".cls")) {
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
        const selectorTemplateContent = fs.readFileSync(path.join(assetsDir, 'SelectorTemplate.cls'), 'utf8');
        const interfaceTemplateContent = fs.readFileSync(path.join(assetsDir, 'InterfaceTemplate.cls'), 'utf8');
        const testTemplateContent = fs.readFileSync(path.join(assetsDir, 'TestTemplate.cls'), 'utf8');
        const bindingTemplateContent = fs.readFileSync(path.join(assetsDir, 'BindingTemplate.xml'), 'utf8');

        const sfdxProject = JSON.parse(fs.readFileSync("sfdx-project.json", "utf8"));
        const defaultDir = sfdxProject.packageDirectories.find(d => d.default).path;
        const apiVersion = sfdxProject.sourceApiVersion || '67.0'; // Default to a recent API version if not found

        const baseSanitized = sanitizeName(sObjectName, appPrefix);
        let pluralSanitized = getPlural(baseSanitized);

        if (pluralSanitized.startsWith(appPrefix + '_')) {
            pluralSanitized = pluralSanitized.substring(appPrefix.length + 1);
        }
        const className = enforceLimit(`${appPrefix}_${pluralSanitized}Selector`);
        const interfaceName = enforceLimit(`${appPrefix}_I${pluralSanitized}Selector`);
        const testClassName = enforceLimit(`${appPrefix}_${pluralSanitized}Selector`, "Test");

        let bindingName = `${appPrefix}_${baseSanitized}`;
        if (baseSanitized.startsWith(appPrefix + '_')) {
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

        const fieldList = explicitFields ? explicitFields.map(f => `            ${sObjectName}.${f}`).join(",\n") : `            ${sObjectName}.Id,\n            ${sObjectName}.Name`;
        
        // const fieldListBlock = `    public List<Schema.SObjectField> getSObjectFieldList()\n    {\n        return new List<Schema.SObjectField> {\n${fieldList}\n        };\n    }`;

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
        changed |= updateFile(paths.selector, "", selectorTemplate);
        // Ensure field list is updated even if file exists
        if (fs.existsSync(paths.selector)) {
            changed |= updateFile(paths.selector, "", selectorTemplate);
        }

        changed |= updateFile(paths.interface, "", interfaceTemplate);
        changed |= updateFile(paths.test, "", testTemplate);

        if (!fs.existsSync(paths.binding)) {
            fs.writeFileSync(paths.binding, bindingTemplate);
            console.log(` - Created: ${paths.binding}`);
            changed = true;
        }

        ["selector", "interface", "test"].forEach(key => {
            const metaPath = paths[key] + "-meta.xml";
            if (!fs.existsSync(metaPath)) {
                fs.writeFileSync(metaPath, `<?xml version="1.0" encoding="UTF-8"?>\n<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">\n    <apiVersion>${apiVersion}</apiVersion>\n    <status>Active</status>\n</ApexClass>`);
            }
        });

        if (changed) {
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
        }
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

run();

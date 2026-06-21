const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const sObjectName = process.argv[2];
const appPrefix = process.argv[3] || "EEORA";
const fieldsArg = process.argv.find(arg => arg.startsWith("--fields="));
const explicitFields = fieldsArg ? fieldsArg.split("=")[1].split(",") : null;

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

    return pluralBase + suffix;
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
        const sfdxProject = JSON.parse(fs.readFileSync("sfdx-project.json", "utf8"));
        const defaultDir = sfdxProject.packageDirectories.find(d => d.default).path;
        const apiVersion = sfdxProject.sourceApiVersion || '67.0'; // Default to a recent API version if not found

        const baseSanitized = sanitizeName(sObjectName, appPrefix);
        const pluralSanitized = getPlural(baseSanitized);

        if (pluralSanitized.startsWith(appPrefix + '_')) {
            pluralSanitized = pluralSanitized.substring(appPrefix.length + 1);
        }
        const className = enforceLimit(`${appPrefix}_${pluralSanitized}Selector`);
        const interfaceName = enforceLimit(`${appPrefix}_I${pluralSanitized}Selector`);
        const testClassName = enforceLimit(`${appPrefix}_${pluralSanitized}Selector`, "Test");
        const bindingFileName = `ApplicationFactory_SelectorBinding.${appPrefix}_${baseSanitized}.md-meta.xml`;

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

        const newInstanceBlock = `    public static ${interfaceName} newInstance()\n    {\n        return (${interfaceName}) Application.Selector.newInstance(${sObjectName}.SObjectType);\n    }`;

        const fieldList = explicitFields ? explicitFields.map(f => `            ${sObjectName}.${f}`).join(",\n") : `            ${sObjectName}.Id,\n            ${sObjectName}.Name`;
        
        const fieldListBlock = `    public List<Schema.SObjectField> getSObjectFieldList()\n    {\n        return new List<Schema.SObjectField> {\n${fieldList}\n        };\n    }`;

        const supportsMR = isSupportedByMetadataRelationship(sObjectName);
        const bindingSObjectValue = supportsMR ? `<value xsi:type="xsd:string">${sObjectName}</value>` : `<value xsi:nil="true"/>`;
        const bindingSObjectAlternateValue = supportsMR ? `<value xsi:nil="true"/>` : `<value xsi:type="xsd:string">${sObjectName}</value>`;

        const selectorTemplate = `public inherited sharing class ${className} \n    extends ApplicationSObjectSelector \n    implements ${interfaceName} \n{\n${newInstanceBlock}\n\n${fieldListBlock}\n\n    public Schema.SObjectType getSObjectType()\n    {\n        return ${sObjectName}.SObjectType;\n    }\n\n    public List<${sObjectName}> selectById(Set<Id> idSet)\n    {\n        return (List<${sObjectName}>) selectSObjectsById(idSet);\n    }\n}`;
        const interfaceTemplate = `public interface ${interfaceName} \n    extends IApplicationSObjectSelector \n{\n    List<${sObjectName}> selectById(Set<Id> idSet);\n}`;
        const testTemplate = `@IsTest\nprivate class ${testClassName} \n{\n    @IsTest\n    private static void testSelectById()\n    {\n        Id recordId = fflib_IDGenerator.generate(${sObjectName}.SObjectType);\n        ${className}.newInstance().selectById(new Set<Id> { recordId });\n    }\n}`;
        const bindingTemplate = `<?xml version="1.0" encoding="UTF-8"?>\n<CustomMetadata xmlns="http://soap.sforce.com/2006/04/metadata" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">\n    <label>${className}</label>\n    <protected>false</protected>\n    <values>\n        <field>BindingSObject__c</field>\n        ${bindingSObjectValue}\n    </values>\n    <values>\n        <field>BindingSObjectAlternate__c</field>\n        ${bindingSObjectAlternateValue}\n    </values>\n    <values>\n        <field>Priority__c</field>\n        <value xsi:nil="true"/>\n    </values>\n    <values>\n        <field>To__c</field>\n        <value xsi:type="xsd:string">${className}</value>\n    </values>\n</CustomMetadata>`;

        console.log(`Processing selector artifacts for ${sObjectName}:`);

        let changed = false;
        changed |= updateFile(paths.selector, newInstanceBlock, selectorTemplate);
        // Ensure field list is updated even if file exists
        if (fs.existsSync(paths.selector)) {
            changed |= updateFile(paths.selector, fieldListBlock, selectorTemplate);
        }

        changed |= updateFile(paths.interface, "", interfaceTemplate);
        changed |= updateFile(paths.test, "testSelectById", testTemplate);

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
            execSync("sf project deploy start", { stdio: "inherit" });
        }
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

run();

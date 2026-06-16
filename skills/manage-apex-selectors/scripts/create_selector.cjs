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
    if (name.endsWith("y")) return name.slice(0, -1) + "ies";
    if (name.endsWith("s") || name.endsWith("sh") || name.endsWith("ch") || name.endsWith("x") || name.endsWith("z")) return name + "es";
    return name + "s";
}

function sanitizeName(name, prefix) {
    let sanitized = name.replace(/__c|__pc/gi, "");
    if (prefix && sanitized.startsWith(prefix + "_")) {
        sanitized = sanitized.substring(prefix.length + 1);
    }
    return sanitized;
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
        console.log(\ - Created: \\);
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
                console.log(\ - Updated field list: \\);
                return true;
            }
            console.log(\ - Field list up to date: \\);
            return false;
        }
    }

    if (existingContent.includes(content.trim())) {
        console.log(\ - Up to date: \\);
        return false;
    }

    if (filePath.endsWith(".cls")) {
        const lastBraceIndex = existingContent.lastIndexOf("}");
        if (lastBraceIndex !== -1) {
            const updated = existingContent.substring(0, lastBraceIndex) + "\\n" + content + "\\n" + existingContent.substring(lastBraceIndex);
            fs.writeFileSync(filePath, updated);
            console.log(\ - Updated: \\);
            return true;
        }
    }
    return false;
}

async function run() {
    try {
        const sfdxProject = JSON.parse(fs.readFileSync("sfdx-project.json", "utf8"));
        const defaultDir = sfdxProject.packageDirectories.find(d => d.default).path;

        const baseSanitized = sanitizeName(sObjectName, appPrefix);
        const pluralSanitized = getPlural(baseSanitized);

        const className = enforceLimit(\\_\Selector\);
        const interfaceName = enforceLimit(\\_I\Selector\);
        const testClassName = enforceLimit(\\_\Selector\, "Test");
        const bindingFileName = \ApplicationFactory_SelectorBinding.\_\.md-meta.xml\;

        const paths = {
            selector: path.join(defaultDir, "main", "classes", "selectors", \\.cls\),
            interface: path.join(defaultDir, "main", "classes", "selectors", \\.cls\),
            binding: path.join(defaultDir, "main", "schema", "customMetadata", "applicationFactoryBindings", "selectorBindings", bindingFileName),
            test: path.join(defaultDir, "test", "classes", "selectors", \\.cls\)
        };

        Object.values(paths).forEach(p => {
            const dir = path.dirname(p);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        });

        const newInstanceBlock = \    public static \ newInstance()\\n    {\\n        return (\) Application.Selector.newInstance(\.SObjectType);\\n    }\;

        const fieldList = explicitFields ? explicitFields.map(f => \            \.\\).join(",\\n") : \            \.Id,\\n            \.Name\;
        
        const fieldListBlock = \    public List<Schema.SObjectField> getSObjectFieldList()\\n    {\\n        return new List<Schema.SObjectField> {\\n\\\n        };\\n    }\;

        const supportsMR = isSupportedByMetadataRelationship(sObjectName);
        const bindingSObjectValue = supportsMR ? \<value xsi:type="xsd:string">\</value>\ : \<value xsi:nil="true"/>\;
        const bindingSObjectAlternateValue = supportsMR ? \<value xsi:nil="true"/>\ : \<value xsi:type="xsd:string">\</value>\;

        const selectorTemplate = \public inherited sharing class \ \\n    extends ApplicationSObjectSelector \\n    implements \ \\n{\\n\\\n\\n\\\n\\n    public Schema.SObjectType getSObjectType()\\n    {\\n        return \.SObjectType;\\n    }\\n\\n    public List<\> selectById(Set<Id> idSet)\\n    {\\n        return (List<\>) selectSObjectsById(idSet);\\n    }\\n}\;
        const interfaceTemplate = \public interface \ \\n    extends IApplicationSObjectSelector \\n{\\n    List<\> selectById(Set<Id> idSet);\\n}\;
        const testTemplate = \@IsTest\\nprivate class \ \\n{\\n    @IsTest\\n    private static void testSelectById()\\n    {\\n        Id recordId = fflib_IDGenerator.generate(\.SObjectType);\\n        \.newInstance().selectById(new Set<Id> { recordId });\\n    }\\n}\;
        const bindingTemplate = \<?xml version="1.0" encoding="UTF-8"?>\\n<CustomMetadata xmlns="http://soap.sforce.com/2006/04/metadata" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">\\n    <label>\</label>\\n    <protected>false</protected>\\n    <values>\\n        <field>BindingSObject__c</field>\\n        \\\n    </values>\\n    <values>\\n        <field>BindingSObjectAlternate__c</field>\\n        \\\n    </values>\\n    <values>\\n        <field>Priority__c</field>\\n        <value xsi:nil="true"/>\\n    </values>\\n    <values>\\n        <field>To__c</field>\\n        <value xsi:type="xsd:string">\</value>\\n    </values>\\n</CustomMetadata>\;

        console.log(\Processing selector artifacts for \:\);

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
            console.log(\ - Created: \\);
            changed = true;
        }

        ["selector", "interface", "test"].forEach(key => {
            const metaPath = paths[key] + "-meta.xml";
            if (!fs.existsSync(metaPath)) {
                fs.writeFileSync(metaPath, \<?xml version="1.0" encoding="UTF-8"?>\\n<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">\\n    <apiVersion>61.0</apiVersion>\\n    <status>Active</status>\\n</ApexClass>\);
            }
        });

        if (changed) {
            console.log("\\nDeploying changes...");
            execSync("sf project deploy start", { stdio: "inherit" });
        }
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

run();

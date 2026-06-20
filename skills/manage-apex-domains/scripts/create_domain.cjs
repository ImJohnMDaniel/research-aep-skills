const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const sObjectName = process.argv[2];
const appPrefix = process.argv[3] || "EEORA";

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
        const sfdxProject = JSON.parse(fs.readFileSync("sfdx-project.json", "utf8"));
        const defaultDir = sfdxProject.packageDirectories.find(d => d.default).path;
        const apiVersion = sfdxProject.sourceApiVersion || '67.0';

        const baseSanitized = sanitizeName(sObjectName, appPrefix);
        const pluralSanitized = getPlural(baseSanitized);

        if (pluralSanitized.startsWith(appPrefix + '_')) {
            pluralSanitized = pluralSanitized.substring(appPrefix.length + 1);
        }
        const className = enforceLimit(`${appPrefix}_${pluralSanitized}`);
        const interfaceName = enforceLimit(`${appPrefix}_I${pluralSanitized}`);
        const testClassName = enforceLimit(`${appPrefix}_${pluralSanitized}`, "Test");
        const triggerName = enforceLimit(`${appPrefix}_${pluralSanitized}`);
        const bindingFileName = `ApplicationFactory_DomainBinding.${appPrefix}_${baseSanitized}.md-meta.xml`;

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

        const newInstanceBlock = `    public static ${interfaceName} newInstance(List<${sObjectName}> records)\n    {\n        return (${interfaceName}) Application.Domain.newInstance(records);\n    }\n\n    public static ${interfaceName} newInstance(Set<Id> recordIds)\n    {\n        return (${interfaceName}) Application.Domain.newInstance(recordIds);\n    }`;
        const constructorClassBlock = `    public class Constructor\n        implements fflib_SObjectDomain.IConstructable\n    {\n        public fflib_SObjectDomain construct(List<SObject> sObjectList)\n        { \n            return new ${className}(sObjectList);\n        }\n    }`;
        const triggerHandlerBlock = `    fflib_SObjectDomain.triggerHandler(${className}.class);`;

        const supportsMR = isSupportedByMetadataRelationship(sObjectName);
        const bindingSObjectValue = supportsMR ? `<value xsi:type="xsd:string">${sObjectName}</value>` : `<value xsi:nil="true"/>`;
        const bindingSObjectAlternateValue = supportsMR ? `<value xsi:nil="true"/>` : `<value xsi:type="xsd:string">${sObjectName}</value>`;

        const domainTemplate = `public inherited sharing class ${className}\n    extends ApplicationSObjectDomain\n    implements ${interfaceName}\n{\n${newInstanceBlock}\n\n    public ${className}()\n    {\n        super( new List<${sObjectName}>() );\n    }\n\n    public ${className}(List<${sObjectName}> records)\n    {\n        super(records);\n    }\n\n${constructorClassBlock}\n}`;
        const interfaceTemplate = `public interface ${interfaceName}\n    extends IApplicationSObjectDomain\n{\n    \n}`;
        const testTemplate = `@IsTest\nprivate class ${testClassName}\n{\n    @IsTest \n    private static void testNewInstanceMethod()\n    {\n        Id recordId = fflib_IDGenerator.generate( ${sObjectName}.SObjectType );\n        ${sObjectName} record = new ${sObjectName}( Id = recordId );\n        Test.startTest();\n        ${className}.newInstance( new List<${sObjectName}>{ record } );\n        ${className}.newInstance( new Set<Id>{ recordId } );\n        Test.stopTest();\n    }\n}`;
        const triggerTemplate = `trigger ${triggerName} on ${sObjectName} \n    (after delete, after insert, after update, after undelete, before delete, before insert, before update) \n{\n${triggerHandlerBlock}\n}`;
        const bindingTemplate = `<?xml version="1.0" encoding="UTF-8"?>\n<CustomMetadata xmlns="http://soap.sforce.com/2006/04/metadata" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">\n    <label>${className}</label>\n    <protected>false</protected>\n    <values>\n        <field>BindingSObject__c</field>\n        ${bindingSObjectValue}\n    </values>\n    <values>\n        <field>BindingSObjectAlternate__c</field>\n        ${bindingSObjectAlternateValue}\n    </values>\n    <values>\n        <field>To__c</field>\n        <value xsi:type="xsd:string">${className}.Constructor</value>\n    </values>\n</CustomMetadata>`;

        console.log(`Processing domain artifacts for ${sObjectName}:`);

        let changed = false;
        changed |= updateFile(paths.domain, newInstanceBlock, domainTemplate);
        if (fs.existsSync(paths.domain)) updateFile(paths.domain, constructorClassBlock, domainTemplate);

        changed |= updateFile(paths.interface, "", interfaceTemplate);
        changed |= updateFile(paths.test, "testNewInstanceMethod", testTemplate);
        changed |= updateFile(paths.trigger, triggerHandlerBlock, triggerTemplate);

        if (!fs.existsSync(paths.binding)) {
            fs.writeFileSync(paths.binding, bindingTemplate);
            console.log(` - Created: ${paths.binding}`);
            changed = true;
        }

        ["domain", "interface", "test", "trigger"].forEach(key => {
            const metaPath = paths[key] + "-meta.xml";
            if (!fs.existsSync(metaPath)) {
                const type = key === "trigger" ? "ApexTrigger" : "ApexClass";
                fs.writeFileSync(metaPath, `<?xml version="1.0" encoding="UTF-8"?>\n<${type} xmlns="http://soap.sforce.com/2006/04/metadata">\n    <apiVersion>${apiVersion}</apiVersion>\n    <status>Active</status>\n</${type}>`);
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

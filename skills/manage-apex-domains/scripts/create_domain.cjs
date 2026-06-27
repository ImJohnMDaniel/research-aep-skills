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

if (!sObjectName) {
    console.error("Error: SObject name is required.");
    console.error("Usage: node create_domain.cjs <SObjectName> [AppPrefix] [--no-deploy]");
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
            const updated = existingContent.substring(0, lastBraceIndex) + "
" + content + "
" + existingContent.substring(lastBraceIndex);
            fs.writeFileSync(filePath, updated);
            console.log(` - Updated: ${filePath}`);
            return true;
        }
    }
    return false;
}

async function run() {
    try {
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

        const baseSanitized = sanitizeName(sObjectName, appPrefix);
        let pluralSanitized = getPlural(baseSanitized);

        if (pluralSanitized.startsWith(appPrefix + '_')) {
            pluralSanitized = pluralSanitized.substring(appPrefix.length + 1);
        }
        const className = enforceLimit(`${appPrefix}_${pluralSanitized}`);
        const interfaceName = enforceLimit(`${appPrefix}_I${pluralSanitized}`);
        const testClassName = enforceLimit(`${appPrefix}_${pluralSanitized}`, "Test");
        const triggerName = enforceLimit(`${appPrefix}_${pluralSanitized}`);

        let bindingName = `${appPrefix}_${baseSanitized}`;
        if (baseSanitized.startsWith(appPrefix + '_')) {
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

        const domainTemplate = `public inherited sharing class ${className}
    extends ApplicationSObjectDomain
    implements ${interfaceName}
{
${newInstanceBlock}

    public ${className}()
    {
        super( new List<${sObjectName}>() );
    }

    public ${className}(List<${sObjectName}> records)
    {
        super(records);
    }

${constructorClassBlock}
}`;
        const interfaceTemplate = `public interface ${interfaceName}
    extends IApplicationSObjectDomain
{
    
}`;
        const testTemplate = `@IsTest
private class ${testClassName}
{
    @IsTest 
    private static void testNewInstanceMethod()
    {
        Id recordId = fflib_IDGenerator.generate( ${sObjectName}.SObjectType );
        ${sObjectName} record = new ${sObjectName}( Id = recordId );
        Test.startTest();
        ${className}.newInstance( new List<${sObjectName}>{ record } );
        ${className}.newInstance( new Set<Id>{ recordId } );
        Test.stopTest();
    }
}`;
        const triggerTemplate = `trigger ${triggerName} on ${sObjectName} 
    (after delete, after insert, after update, after undelete, before delete, before insert, before update) 
{
${triggerHandlerBlock}
}`;
        const bindingTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<CustomMetadata xmlns="http://soap.sforce.com/2006/04/metadata" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
    <label>${className}</label>
    <protected>false</protected>
    <values>
        <field>BindingSObject__c</field>
        ${bindingSObjectValue}
    </values>
    <values>
        <field>BindingSObjectAlternate__c</field>
        ${bindingSObjectAlternateValue}
    </values>
    <values>
        <field>To__c</field>
        <value xsi:type="xsd:string">${className}.Constructor</value>
    </values>
</CustomMetadata>`;

        console.log(`
--- Step 2: Creating/Updating Domain Artifacts for ${sObjectName} ---`);

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
                fs.writeFileSync(metaPath, `<?xml version="1.0" encoding="UTF-8"?>
<${type} xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>${apiVersion}</apiVersion>
    <status>Active</status>
</${type}>`);
            }
        });

        if (changed && !flags['no-deploy']) {
            console.log("
Deploying changes...");
            execSync("sf project deploy start --ignore-conflicts", { stdio: "inherit" });
        } else if (changed) {
            console.log("
Skipping deployment due to --no-deploy flag.");
        } else {
            console.log("
No changes detected. Skipping deployment.");
        }
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

run();

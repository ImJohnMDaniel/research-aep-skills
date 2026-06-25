const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const readline = require("readline");

// --- Argument Parsing ---
const componentName = process.argv[2];
const sObjectName = process.argv[3];
const type = process.argv[4]; // Criteria | Action

if (!componentName || !sObjectName || !type) {
    console.error("Usage: node create_injection.cjs <ComponentName> <SObjectName> <Type>");
    console.error("Type must be 'Criteria' or 'Action'");
    process.exit(1);
}

const isCriteria = type.toLowerCase() === 'criteria';
const isAction = type.toLowerCase() === 'action';

if (!isCriteria && !isAction) {
    console.error("Error: Type must be either 'Criteria' or 'Action'.");
    process.exit(1);
}


// --- Interactive Prompt Setup ---
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));


// --- Main Execution ---
async function run() {
    try {
        // --- Stage 1: Generate Apex Class (The "Good" Part) ---
        console.log(`
--- Stage 1: Creating Apex Class for ${componentName} ---`);

        const sfdxProject = JSON.parse(fs.readFileSync("sfdx-project.json", "utf8"));
        const defaultDir = sfdxProject.packageDirectories.find(d => d.default).path;
        const apiVersion = sfdxProject.sourceApiVersion;

        const skillPath = path.join(__dirname, "..");
        const assetsDir = path.join(skillPath, "assets");
        const bindingDir = path.join(defaultDir, "main", "schema", "customMetadata", "domainProcessBindings");

        const subDir = isCriteria ? "criteria" : "actions";
        const classPath = path.join(defaultDir, "main", "classes", subDir, `${componentName}.cls`);
        const metaPath = classPath + "-meta.xml";

        // Ensure directories exist
        if (!fs.existsSync(path.dirname(classPath))) fs.mkdirSync(path.dirname(classPath), { recursive: true });
        if (!fs.existsSync(bindingDir)) fs.mkdirSync(bindingDir, { recursive: true });

        const templateFile = isCriteria ? "CriteriaTemplate.cls" : "ActionTemplate.cls";
        let classContent = fs.readFileSync(path.join(assetsDir, templateFile), "utf8");
        classContent = classContent.replace(/{{ClassName}}/g, componentName).replace(/{{SObjectName}}/g, sObjectName);
        fs.writeFileSync(classPath, classContent);

        const classMeta = `<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>${apiVersion}</apiVersion>
    <status>Active</status>
</ApexClass>`;
        fs.writeFileSync(metaPath, classMeta);

        console.log(`✔ Created Class: ${classPath}`);
        console.log(`✔ Created Meta:  ${metaPath}`);

        // --- Stage 2: Interactive Binding Configuration ---
        console.log(`
--- Stage 2: Create Domain Process Binding ---`);
        const createBinding = await askQuestion("Do you want to create a DomainProcessBinding metadata record now? (y/n) ");
        if (createBinding.toLowerCase() !== 'y') {
            console.log("Skipping binding creation. Exiting.");
            return;
        }

        const processGroup = parseInt(await askQuestion("Enter the Domain Process Group number (e.g., 10, 20): "), 10);
        if (isNaN(processGroup)) {
            console.error("Invalid number. Exiting.");
            return;
        }

        // Scan for existing execution orders in this group
        let highestDecimal = 0;
        const existingBindings = fs.readdirSync(bindingDir);
        existingBindings.forEach(file => {
            const content = fs.readFileSync(path.join(bindingDir, file), 'utf8');
            const orderMatch = content.match(/<field>OrderOfExecution__c<\/field>\s*<value.*>(\d+\.\d+)/);
            if (orderMatch) {
                const order = parseFloat(orderMatch[1]);
                if (Math.floor(order) === processGroup && order > highestDecimal) {
                    highestDecimal = order;
                }
            }
        });

        const nextOrder = highestDecimal === 0 ? `${processGroup}.1` : (Math.floor(highestDecimal) + (Math.round((highestDecimal % 1) * 10) / 10) + 0.1).toFixed(1);
        const finalOrder = await askQuestion(`Suggested execution order is ${nextOrder}. Press Enter to accept or enter a different value: `) || nextOrder;

        const triggerOpsAnswer = await askQuestion("Enter Trigger Operation(s) (comma-separated, e.g., After_Insert,After_Update): ");
        const triggerOperations = triggerOpsAnswer.split(',').map(op => op.trim()).filter(Boolean);
        
        if(triggerOperations.length === 0) {
            console.log("No trigger operations specified. Exiting.");
            return;
        }

        const bindingTemplateFile = isCriteria ? "CriteriaBindingTemplate.xml" : "ActionBindingTemplate.xml";
        let bindingTemplate = fs.readFileSync(path.join(assetsDir, bindingTemplateFile), "utf8");

        for (const operation of triggerOperations) {
            // Generate a safer, shorter name to avoid 40-char limit
            const bindingName = `${sObjectName}_${componentName}_${operation}`.substring(0, 40);
            const bindingPath = path.join(bindingDir, `DomainProcessBinding.${bindingName}.md-meta.xml`);
            
            let bindingContent = bindingTemplate
                .replace(/REPLACE_ME/g, bindingName) // Use a single replace for the label
                .replace(/<field>ClassToInject__c<\/field>\s*<value.*>REPLACE_ME<\/value>/, `<field>ClassToInject__c</field>
        <value xsi:type="xsd:string">${componentName}</value>`)
                .replace(/<field>Description__c<\/field>\s*<value.*>REPLACE_ME<\/value>/, `<field>Description__c</field>
        <value xsi:type="xsd:string">Domain Process for ${sObjectName} during ${operation}</value>`)
                .replace(/<field>OrderOfExecution__c<\/field>\s*<value.*>REPLACE_ME<\/value>/, `<field>OrderOfExecution__c</field>
        <value xsi:type="xsd:double">${finalOrder}</value>`)
                .replace(/<field>RelatedDomainBindingSObjectAlternate__c<\/field>\s*<value.*>REPLACE_ME<\/value>/, `<field>RelatedDomainBindingSObjectAlternate__c</field>
        <value xsi:type="xsd:string">${sObjectName}</value>`)
                .replace(/<field>TriggerOperation__c<\/field>\s*<value.*>REPLACE_ME<\/value>/, `<field>TriggerOperation__c</field>
        <value xsi:type="xsd:string">${operation}</value>`);

            fs.writeFileSync(bindingPath, bindingContent);
            console.log(`✔ Created Binding: ${bindingPath}`);
        }

        console.log("
Deploying all new components...");
        execSync("sf project deploy start", { stdio: "inherit" });

    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

run();

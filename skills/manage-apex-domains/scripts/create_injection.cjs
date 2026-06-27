#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const readline = require("readline");

// --- Argument Parsing ---
const componentName = process.argv[2];
const sObjectName = process.argv[3];
const type = process.argv[4]; // Criteria | Action

if (!componentName || !sObjectName || !type) {
    console.error("Usage: node create_injection.cjs <ComponentName> <SObjectName> <Type> [flags]");
    console.error("Type must be 'Criteria' or 'Action'");
    process.exit(1);
}

const isCriteria = type.toLowerCase() === 'criteria';
const isAction = type.toLowerCase() === 'action';

if (!isCriteria && !isAction) {
    console.error("Error: Type must be either 'Criteria' or 'Action'.");
    process.exit(1);
}

// Parse custom flags
const args = process.argv.slice(5);
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

const isNonInteractive = !!(flags.group && flags.ops);

// AGENT SAFETY CHECK: Ensure agent is running in non-interactive mode.
if (process.env.IS_GEMINI_AGENT === 'true' && !isNonInteractive) {
    console.error("AGENT_ERROR: This script must be run non-interactively by an agent. Provide all required data using command-line flags (--group, --ops, --order, etc.).");
    process.exit(1);
}

// Validate non-interactive flags if supplied
if (isNonInteractive) {
    const context = flags.context || "TriggerExecution";
    if (context !== "TriggerExecution" && context !== "DomainMethodExecution") {
        console.error("Error: --context must be either 'TriggerExecution' or 'DomainMethodExecution'.");
        process.exit(1);
    }
}

// --- Interactive Prompt Setup ---
let rl;
if (!isNonInteractive) {
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

// --- Main Execution ---
async function run() {
    try {
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

        // Parse trigger operations early for non-interactive mode
        let triggerOperations = [];
        if (isNonInteractive) {
            triggerOperations = flags.ops.split(',').map(op => op.trim()).filter(Boolean);
            if (triggerOperations.length === 0) {
                console.error("Error: No trigger operations specified in --ops.");
                process.exit(1);
            }
        }

        // --- Stage 1: Generate Apex Class ---
        console.log(`\n--- Stage 1: Creating Apex Class for ${componentName} ---`);

        // Select the correct template file
        let templateFile;
        if (isCriteria) {
            const hasUpdateOrDelete = isNonInteractive && triggerOperations.some(op => {
                const lOp = op.toLowerCase();
                return lOp.includes('update') || lOp.includes('delete');
            });
            templateFile = hasUpdateOrDelete ? "CriteriaWithExistingRecsTemplate.cls" : "CriteriaTemplate.cls";
        } else {
            if (flags.async) {
                templateFile = "QueueableActionTemplate.cls";
            } else {
                const hasUpdateOrDelete = isNonInteractive && triggerOperations.some(op => {
                    const lOp = op.toLowerCase();
                    return lOp.includes('update') || lOp.includes('delete');
                });
                templateFile = hasUpdateOrDelete ? "ActionWithExistingRecsTemplate.cls" : "ActionTemplate.cls";
            }
        }

        let classContent = fs.readFileSync(path.join(assetsDir, templateFile), "utf8");
        classContent = classContent.replace(/{{ClassName}}/g, componentName).replace(/{{SObjectName}}/g, sObjectName);
        fs.writeFileSync(classPath, classContent);

        const classMeta = `<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>${apiVersion}</apiVersion>
    <status>Active</status>
</ApexClass>`;
        fs.writeFileSync(metaPath, classMeta);

        console.log(`✔ Created Class: ${classPath} (using ${templateFile})`);
        console.log(`✔ Created Meta:  ${metaPath}`);

        // --- Stage 2: Binding Configuration ---
        let processGroup;
        let finalOrder;
        let skipBinding = false;

        if (isNonInteractive) {
            console.log(`\n--- Stage 2: Creating Domain Process Bindings (Non-Interactive) ---`);
            processGroup = parseInt(flags.group, 10);
            if (isNaN(processGroup)) {
                console.error("Error: --group must be a valid number.");
                process.exit(1);
            }
        } else {
            console.log(`\n--- Stage 2: Create Domain Process Binding ---`);
            const createBinding = await askQuestion("Do you want to create a DomainProcessBinding metadata record now? (y/n) ");
            if (createBinding.toLowerCase() !== 'y') {
                console.log("Skipping binding creation. Exiting.");
                skipBinding = true;
            }

            if (!skipBinding) {
                processGroup = parseInt(await askQuestion("Enter the Domain Process Group number (e.g., 10, 20): "), 10);
                if (isNaN(processGroup)) {
                    console.error("Invalid number. Exiting.");
                    return;
                }
            }
        }

        if (!skipBinding) {
            // Scan for existing execution orders in this group
            let highestDecimal = 0;
            if (fs.existsSync(bindingDir)) {
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
            }

            const nextOrder = highestDecimal === 0 ? `${processGroup}.1` : (Math.floor(highestDecimal) + (Math.round((highestDecimal % 1) * 10) / 10) + 0.1).toFixed(1);

            if (isNonInteractive) {
                finalOrder = flags.order ? parseFloat(flags.order) : parseFloat(nextOrder);
                if (isNaN(finalOrder)) {
                    console.error("Error: --order must be a valid number.");
                    process.exit(1);
                }
            } else {
                finalOrder = await askQuestion(`Suggested execution order is ${nextOrder}. Press Enter to accept or enter a different value: `) || nextOrder;
                finalOrder = parseFloat(finalOrder);

                const triggerOpsAnswer = await askQuestion("Enter Trigger Operation(s) (comma-separated, e.g., After_Insert,After_Update): ");
                triggerOperations = triggerOpsAnswer.split(',').map(op => op.trim()).filter(Boolean);
                
                if (triggerOperations.length === 0) {
                    console.log("No trigger operations specified. Exiting.");
                    return;
                }
            }

            const bindingTemplateFile = isCriteria ? "CriteriaBindingTemplate.xml" : "ActionBindingTemplate.xml";
            let bindingTemplate = fs.readFileSync(path.join(assetsDir, bindingTemplateFile), "utf8");

            const contextValue = flags.context || "TriggerExecution";
            const descriptionValue = flags.description || `Domain Process for ${sObjectName}`;

            for (const operation of triggerOperations) {
                // --- START: Custom Naming Convention Logic ---

                // 1. Define the mapping for trigger operation abbreviations.
                const opAbbreviations = {
                    'After_Insert': 'AftIns',
                    'After_Update': 'AftUpt',
                    'After_Delete': 'AftDel',
                    'After_Undelete': 'AftUnd',
                    'Before_Insert': 'BefIns',
                    'Before_Update': 'BefUpt',
                    'Before_Delete': 'BefDel'
                };

                // Get the abbreviation for the current operation, or use the full name as a fallback.
                const abbreviatedOp = opAbbreviations[operation] || operation;

                // 2. Extract the prefix (e.g., "EEORA") from the full component name.
                const prefix = componentName.split('_')[0];

                // 3. Get the core part of the class name that needs to be abbreviated.
                const classNameToAbbreviate = componentName.substring(prefix.length + 1);

                // 4. Calculate the maximum length available for the class name part.
                // Formula: 40 - (prefix + underscore + abbreviation + underscore)
                const maxClassNameLength = 40 - prefix.length - 1 - abbreviatedOp.length - 1;

                // Abbreviate the class name part by truncating it if it's too long.
                const abbreviatedClassName = classNameToAbbreviate.length > maxClassNameLength
                    ? classNameToAbbreviate.substring(0, maxClassNameLength)
                    : classNameToAbbreviate;

                // 5. Construct the final binding name using your specified convention.
                const bindingName = `${prefix}_${abbreviatedClassName}_${abbreviatedOp}`;

                // --- END: Custom Naming Convention Logic ---

                const bindingPath = path.join(bindingDir, `DomainProcessBinding.${bindingName}.md-meta.xml`);
                
                let bindingContent = bindingTemplate
                    .replace(/<label>REPLACE_ME<\/label>/, `<label>${bindingName}</label>`)
                    .replace(/<field>ClassToInject__c<\/field>\s*<value.*>REPLACE_ME<\/value>/, `<field>ClassToInject__c</field>\n        <value xsi:type="xsd:string">${componentName}</value>`)
                    .replace(/<field>Description__c<\/field>\s*<value.*>REPLACE_ME<\/value>/, `<field>Description__c</field>\n        <value xsi:type="xsd:string">${descriptionValue} during ${operation}</value>`)
                    .replace(/<field>OrderOfExecution__c<\/field>\s*<value.*>REPLACE_ME<\/value>/, `<field>OrderOfExecution__c</field>\n        <value xsi:type="xsd:double">${finalOrder.toFixed(1)}</value>`)
                    .replace(/<field>RelatedDomainBindingSObjectAlternate__c<\/field>\s*<value.*>REPLACE_ME<\/value>/, `<field>RelatedDomainBindingSObjectAlternate__c</field>\n        <value xsi:type="xsd:string">${sObjectName}</value>`)
                    .replace(/<field>TriggerOperation__c<\/field>\s*<value.*>REPLACE_ME<\/value>/, `<field>TriggerOperation__c</field>\n        <value xsi:type="xsd:string">${operation}</value>`);

                // Dynamic Context Replacement
                bindingContent = bindingContent.replace(/<field>ProcessContext__c<\/field>\s*<value.*>TriggerExecution<\/value>/, `<field>ProcessContext__c</field>\n        <value xsi:type="xsd:string">${contextValue}</value>`);

                const isAsync = !!flags.async;
                if (isAsync) {
                    bindingContent = bindingContent.replace(
                        /<field>ExecuteAsynchronous__c<\/field>\s*<value.*>false<\/value>/, 
                        `<field>ExecuteAsynchronous__c</field>\n        <value xsi:type="xsd:boolean">true</value>`
                    );
                }

                fs.writeFileSync(bindingPath, bindingContent);
                console.log(`✔ Created Binding: ${bindingPath}`);
            }
        }

        if (!flags['no-deploy']) {
            console.log("\nDeploying all new components...");
            execSync("sf project deploy start --ignore-conflicts --json", { stdio: "pipe" });
        } else {
            console.log("\nSkipping deployment as requested by --no-deploy flag.");
        }

    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    } finally {
        if (rl) {
            rl.close();
        }
    }
}

run();

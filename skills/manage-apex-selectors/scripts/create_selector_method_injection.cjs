#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// --- Argument Parsing ---
const componentName = process.argv[2];
const sObjectName = process.argv[3];
const selectorName = process.argv[4]; // This is the selector name now

if (!componentName || !sObjectName || !selectorName) {
    console.error("Usage: node create_selector_method_injection.cjs <ComponentName> <SObjectName> <SelectorName> [--params=\"<Type1> <param1>, ...\"] [--no-deploy]");
    console.error("Example: node create_selector_method_injection.cjs EEORA_UsersByState User UCMN_UsersSelector --params=\"Set<String> states, Integer resultLimit\"");
    process.exit(1);
}

// Parse custom flags
const args = process.argv.slice(5); // Start after the main args
const flags = {};
for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
        let key = arg.slice(2);
        let value = true;

        if (key.includes('=')) {
            [key, value] = key.split('=');
        } else if (args[i + 1] && !args[i + 1].startsWith('--')) {
            value = args[i + 1];
            i++;
        }
        flags[key] = value;
    }
}
flags.selectorName = selectorName; // Add selectorName to flags for consistency


// AGENT SAFETY CHECK: Prevent interactive mode for agents.
if (process.env.IS_GEMINI_AGENT === 'true' && !flags.params) {
    // In an agent context, we assume non-interaction, but params are common.
    // This could be enhanced to require a flag confirming no params are needed.
}

function validateIdentifier(name, type) {
    if (name.length > 40) {
        throw new Error(`Generated ${type} name "${name}" (${name.length} chars) exceeds the 40-character limit for Apex class names. Please provide a shorter <ComponentName>.`);
    }
}

function enforceLimit(baseName, suffix = "") {
    const limit = 40;
    if ((baseName + suffix).length <= limit) {
        return baseName + suffix;
    }
    const availableLength = limit - suffix.length;
    return baseName.substring(0, availableLength) + suffix;
}

// --- Main Execution ---
async function run() {
    try {
        const sfdxProject = JSON.parse(fs.readFileSync("sfdx-project.json", "utf8"));
        const defaultDir = sfdxProject.packageDirectories.find(d => d.default).path;
        const apiVersion = sfdxProject.sourceApiVersion;

        const skillPath = path.join(__dirname, "..");
        const assetsDir = path.join(skillPath, "assets");
        
        const injectableDir = path.join(defaultDir, "main", "classes", "selectors", "injectables");
        const injectableTestDir = path.join(defaultDir, "test", "classes", "selectors", "injectables");

        // --- File Naming ---
        const paramsSuffix = 'SelectorParams';
        const methodSuffix = 'SelectorMethod';
        const testSuffix = 'SelectorMethod_UT';

        const paramsClassName = enforceLimit(componentName, paramsSuffix);
        const methodClassName = enforceLimit(componentName, methodSuffix);
        const testClassName = enforceLimit(componentName, testSuffix);

        // Validate final names
        try {
            validateIdentifier(paramsClassName, 'Params class');
            validateIdentifier(methodClassName, 'Method class');
            validateIdentifier(testClassName, 'Test class');
        } catch (e) {
            console.error(`\n--- ABORTING ---`);
            console.error(`Error: ${e.message}`);
            process.exit(1);
        }

        const paths = {
            params: path.join(injectableDir, `${paramsClassName}.cls`),
            method: path.join(injectableDir, `${methodClassName}.cls`),
            test: path.join(injectableTestDir, `${testClassName}.cls`)
        };

        // Ensure directories exist
        Object.values(paths).forEach(p => {
            const dir = path.dirname(p);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        });

        // --- Read Templates ---
        const paramsTemplate = fs.readFileSync(path.join(assetsDir, "InjectableMethodParamsTemplate.cls"), "utf8");
        const methodTemplate = fs.readFileSync(path.join(assetsDir, "InjectableMethodTemplate.cls"), "utf8");
        const testTemplate = fs.readFileSync(path.join(assetsDir, "InjectableMethodTestTemplate.cls"), "utf8");
        
        // --- 1. Generate Params Class ---
        let paramMembers = "    // No parameters defined. Add public member variables here if needed.";
        let testParamAssignments = "        // No parameters to assign.";
        if (flags.params) {
            paramMembers = flags.params.split(',')
                .map(p => `    public ${p.trim()};`)
                .join('\n');
            
            testParamAssignments = flags.params.split(',')
                .map(p => `        params.${p.trim().split(' ')[1]} = /* TODO: Assign test value */;`)
                .join('\n');
        }

        // Replace template placeholders dynamically with generated (and potentially truncated) class names
        let paramsContent = paramsTemplate
            .replace(/%%METHOD_NAME%%SelectorParams/g, paramsClassName)
            .replace(/%%METHOD_NAME%%/g, componentName);

        // Robustly replace the entire class body
        if(paramMembers) {
            paramsContent = paramsContent.replace(/\{\s*([\s\S]*?)\s*\}/, `{\n${paramMembers}\n}`);
        } else {
            paramsContent = paramsContent.replace(/\{\s*([\s\S]*?)\s*\}/, `{\n    // No parameters defined. Add public member variables here if needed.\n}`);
        }

        fs.writeFileSync(paths.params, paramsContent);
        console.log(`✔ Created Params Class: ${paths.params}`);

        // --- 2. Generate Method Class ---
        let methodContent = methodTemplate
            .replace(/%%METHOD_NAME%%SelectorParams/g, paramsClassName)
            .replace(/%%METHOD_NAME%%SelectorMethod/g, methodClassName)
            .replace(/%%METHOD_NAME%%/g, componentName)
            .replace(/%%SOBJECT_API_NAME%%/g, sObjectName);
        
        fs.writeFileSync(paths.method, methodContent);
        console.log(`✔ Created Method Class: ${paths.method}`);

        // --- 3. Generate Test Class ---
        // Derive interface name from concrete class name
        // Example: UCMN_UsersSelector -> UCMN_IUsersSelector
        let selectorInterfaceName = selectorName;
        if (selectorName.includes('_')) {
            const parts = selectorName.split('_');
            const lastPart = parts.pop(); // UsersSelector
            parts.push('I' + lastPart); // IUsersSelector
            selectorInterfaceName = parts.join('_');
        } else {
            selectorInterfaceName = 'I' + selectorName;
        }

        let testContent = testTemplate
            .replace(/%%METHOD_NAME%%SelectorParams/g, paramsClassName)
            .replace(/%%METHOD_NAME%%SelectorMethod_UT/g, testClassName)
            .replace(/%%METHOD_NAME%%SelectorMethod/g, methodClassName)
            .replace(/%%METHOD_NAME%%/g, componentName)
            .replace(/%%TEST_PARAM_ASSIGNMENTS%%/g, testParamAssignments)
            .replace(/%%SOBJECT_NAME%%/g, sObjectName)
            .replace(/%%SELECTOR_NAME%%/g, selectorName)
            .replace(/%%SELECTOR_INTERFACE_NAME%%/g, selectorInterfaceName);
        
        fs.writeFileSync(paths.test, testContent);
        console.log(`✔ Created Test Class: ${paths.test}`);

        // --- 4. Generate Meta Files ---
        [paths.params, paths.method, paths.test].forEach(p => {
            const metaPath = p + "-meta.xml";
            const metaContent = `<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>${apiVersion}</apiVersion>
    <status>Active</status>
</ApexClass>`;
            fs.writeFileSync(metaPath, metaContent);
        });
        
        // --- 5. Deploy ---
        if (!flags['no-deploy']) {
            console.log("\nDeploying all new components...");
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
        } else {
            console.log("\nSkipping deployment as requested by --no-deploy flag. Please complete the implementation and deploy manually.");
        }

    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

run();

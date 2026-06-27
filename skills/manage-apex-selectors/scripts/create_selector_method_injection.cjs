#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// --- Argument Parsing ---
const componentName = process.argv[2];
const sObjectName = process.argv[3];

if (!componentName || !sObjectName) {
    console.error("Usage: node create_selector_method_injection.cjs <ComponentName> <SObjectName> [--params=\"<Type1> <param1>, ...\"] [--no-deploy]");
    console.error("Example: node create_selector_method_injection.cjs EEORA_UsersByState User --params=\"Set<String> states, Integer resultLimit\"");
    process.exit(1);
}

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
            // Strip wrapping quotes if present
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
            flags[key] = value;
        } else {
            flags[cleanArg] = true;
        }
    }
}

// AGENT SAFETY CHECK: Prevent interactive mode for agents.
if (process.env.IS_GEMINI_AGENT === 'true' && !flags.params) {
    // In an agent context, we assume non-interaction, but params are common.
    // This could be enhanced to require a flag confirming no params are needed.
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
        const paramsClassName = `${componentName}SelectorParams`;
        const methodClassName = `${componentName}SelectorMethod`;
        const testClassName = `${componentName}SelectorMethod_UT`;

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
let paramsContent = paramsTemplate
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
            .replace(/%%METHOD_NAME%%/g, componentName)
            .replace(/%%SOBJECT_API_NAME%%/g, sObjectName);
        
        fs.writeFileSync(paths.method, methodContent);
        console.log(`✔ Created Method Class: ${paths.method}`);

        // --- 3. Generate Test Class ---
        let testContent = testTemplate
            .replace(/%%METHOD_NAME%%/g, componentName)
            .replace(/%%TEST_PARAM_ASSIGNMENTS%%/g, testParamAssignments);
        
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
            execSync("sf project deploy start --ignore-conflicts --json", { stdio: "pipe" });
        } else {
            console.log("\nSkipping deployment as requested by --no-deploy flag. Please complete the implementation and deploy manually.");
        }

    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

run();

#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const CWD = process.cwd();

function parseArgs(args) {
    const result = { _: [] };
    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith('--')) {
            const key = args[i].substring(2);
            const value = (i + 1 < args.length && !args[i+1].startsWith('--')) ? args[i+1] : true;
            result[key] = value;
            if (value !== true) i++;
        } else {
            result._.push(args[i]);
        }
    }
    return result;
}

function main() {
    const rawArgs = process.argv.slice(2);
    const args = parseArgs(rawArgs);
    const command = args._[0];

    try {
        if (command === 'create_apex_class') {
            handleCreateApexClass(args);
            console.log(JSON.stringify({ success: true, path: args.path }, null, 2));
        } else {
            // Fallback to original manifest logic
            handleManifest(rawArgs);
        }
    } catch (e) {
        console.error(JSON.stringify({ success: false, error: e.message, stack: e.stack }, null, 2));
        process.exit(1);
    }
}

function handleCreateApexClass(args) {
    const { path: filePath, body, type, sobject } = args;
    if (!filePath || !body || !type ) {
        throw new Error("Missing required arguments: --path, --body, and --type are required for create_apex_class");
    }

    // ARCHITECTURAL GUARDRAIL: Prevent creating selectors/domains for standard SObjects
    if (type === 'Selector' || type === 'Domain') {
        if (!sobject) {
            throw new Error(`--sobject is required when creating a ${type}`);
        }
        // Heuristic: If the SObject name doesn't contain '__', it's a standard object.
        if (sobject.indexOf('__') === -1) {
            throw new Error(`ARCHITECTURAL VIOLATION: You attempted to create a ${type} for the standard SObject '${sobject}'. This is not allowed. You must first use 'learn-org-symbol-table' to find an existing component from a dependency package and then use the appropriate injection pattern if needed. Aborting.`);
        }
    }

    // 1. Get API Version from sfdx-project.json at the project root (CWD)
    const projectJsonPath = path.join(CWD, 'sfdx-project.json');
    if (!fs.existsSync(projectJsonPath)) {
        throw new Error(`sfdx-project.json not found at: ${projectJsonPath}`);
    }
    const projectConfig = JSON.parse(fs.readFileSync(projectJsonPath, 'utf8'));
    const apiVersion = projectConfig.sourceApiVersion;
    if (!apiVersion) {
        throw new Error('sourceApiVersion not found in sfdx-project.json');
    }

    // 2. Create directory if it doesn't exist
    const fullPath = path.join(CWD, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });

    // 3. Create .cls file
    fs.writeFileSync(fullPath, body);

    // 4. Create .cls-meta.xml file
    const metaXmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>${apiVersion}</apiVersion>
    <status>Active</status>
</ApexClass>
`;
    const metaXmlPath = fullPath + '-meta.xml';
    fs.writeFileSync(metaXmlPath, metaXmlContent);
}


function handleManifest(args) {
    if (args.length === 0) {
        console.error('Error: Missing JSON manifest argument.');
        process.exit(1);
    }
    
    const jsonString = args.join(' ');

    let manifest;
    try {
        manifest = JSON.parse(jsonString);
    } catch (e) {
        console.error('Error: Invalid JSON manifest:', e.message);
        console.error('Received:', jsonString);
        process.exit(1);
    }

    const results = { success: [], errors: [] };

    manifest.operations.forEach(op => {
        try {
            switch (op.action) {
                case 'create':
                    handleCreateFromTemplate(op);
                    results.success.push(`Created: ${op.name}`);
                    break;
                case 'register':
                    handleRegister(op);
                    results.success.push(`Registered: ${op.params.Class}`);
                    break;
                case 'delete':
                    handleDelete(op);
                    results.success.push(`Deleted: ${op.path}`);
                    break;
                default:
                    throw new Error(`Unknown action: ${op.action}`);
            }
        } catch (e) {
            results.errors.push(`Failed ${op.action}: ${e.message}`);
        }
    });

    console.log(JSON.stringify(results, null, 2));
}

function findTemplate(templateName) {
    const assetFolders = [
        'skills/manage-apex-domains/assets',
        'skills/manage-apex-selectors/assets'
    ];
    for (const folder of assetFolders) {
        const extensions = ['.cls', '.trigger', '.xml'];
        for (const ext of extensions) {
            // The script runs from the workspace root, but the templates are relative to the skill directory
            const fullPath = path.join(__dirname, '..', '..', folder, `${templateName}Template${ext}`);
            if (fs.existsSync(fullPath)) return fullPath;
        }
    }
    throw new Error(`Template not found: ${templateName}`);
}

function handleCreateFromTemplate(op) {
    const templatePath = findTemplate(op.template);
    let content = fs.readFileSync(templatePath, 'utf8');

    Object.keys(op.params).forEach(key => {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), op.params[key]);
    });

    // Determine output path based on type (heuristic)
    // This path is relative to the CWD, which is the project root
    const outputPath = templatePath.endsWith('.xml') 
        ? path.join('force-app/main/default/objects', `${op.name}.xml`)
        : path.join('force-app/main/default/classes', `${op.name}.cls`);
        
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, content);
}

function handleRegister(op) {
    // Basic stub for metadata registration logic
    console.log('Registering:', op);
}

function handleDelete(op) {
    if (fs.existsSync(op.path)) {
        fs.unlinkSync(op.path);
    } else {
        throw new Error(`File not found: ${op.path}`);
    }
}

main();

/**
 * apex_orchestrator.cjs
 * 
 * A generalized execution engine for the sf-aep-skills extension.
 * This script processes a batch of operations (create, delete, register)
 * defined in a JSON manifest to reduce conversational turns.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Parse Argument
const manifestArg = process.argv[2];
if (!manifestArg) {
    console.error("Error: No manifest provided.");
    process.exit(1);
}

let manifest;
try {
    manifest = JSON.parse(manifestArg);
} catch (e) {
    console.error("Error: Invalid JSON manifest.");
    process.exit(1);
}

// 2. Constants & Paths
const PROJECT_ROOT = process.cwd();
// In a real implementation, these would dynamically locate the skill folders
const TEMPLATE_DIR = path.join(__dirname, '../../manage-apex-domains/assets'); 

/**
 * Core Operational Logic
 */
async function run() {
    console.log("--- Starting Batch Orchestration ---");
    const results = [];

    for (const op of manifest.operations) {
        try {
            switch (op.action) {
                case 'create':
                    handleCreate(op);
                    results.push(`[SUCCESS] Created ${op.name}`);
                    break;
                case 'delete':
                    handleDelete(op);
                    results.push(`[SUCCESS] Deleted ${op.path}`);
                    break;
                case 'register':
                    handleRegister(op);
                    results.push(`[SUCCESS] Registered ${op.type} for ${op.params.Class}`);
                    break;
                default:
                    results.push(`[ERROR] Unknown action: ${op.action}`);
            }
        } catch (err) {
            results.push(`[FAILED] ${op.action} ${op.name || op.path}: ${err.message}`);
        }
    }

    console.log("\nSummary of Operations:");
    results.forEach(r => console.log(r));

    // Optional: Auto-deploy the batch
    // console.log("\nDeploying changes...");
    // execSync('sf project deploy start');
}

/**
 * Logic for creating classes from templates
 */
function handleCreate(op) {
    const templatePath = path.join(TEMPLATE_DIR, `${op.template}Template.cls`);
    let content = fs.readFileSync(templatePath, 'utf8');

    // Replace placeholders
    if (op.params) {
        Object.keys(op.params).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            content = content.replace(regex, op.params[key]);
        });
    }
    content = content.replace(/{{ClassName}}/g, op.name);

    // Determine target path (this logic should be more robust in production)
    const subDir = op.template.toLowerCase().includes('criteria') ? 'criteria' : 'actions';
    const targetDir = path.join(PROJECT_ROOT, 'sfdx-source/eeora/main/classes', subDir);
    
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    
    fs.writeFileSync(path.join(targetDir, `${op.name}.cls`), content);
    
    // Create basic meta file
    const metaContent = `<?xml version="1.0" encoding="UTF-8"?>\n<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">\n    <apiVersion>61.0</apiVersion>\n    <status>Active</status>\n</ApexClass>`;
    fs.writeFileSync(path.join(targetDir, `${op.name}.cls-meta.xml`), metaContent);
}

/**
 * Logic for deleting files locally and in Org
 */
function handleDelete(op) {
    if (fs.existsSync(op.path)) {
        fs.unlinkSync(op.path);
        const metaPath = op.path + "-meta.xml";
        if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
        // Note: Real implementation would handle 'sf project delete source'
    }
}

/**
 * Logic for registering Custom Metadata bindings
 */
function handleRegister(op) {
    // Logic to read BindingTemplate.xml and write to customMetadata folder
    // Similar to handleCreate but for XML files
    console.log(`Stub: Registering ${op.type} for ${op.params.Class}`);
}

run();

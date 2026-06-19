const fs = require('fs');
const path = require('path');

function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('Error: Missing JSON manifest argument.');
        process.exit(1);
    }
    
    // Join all args and try to parse the full string
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
                    handleCreate(op);
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
            const fullPath = path.join(folder, `${templateName}Template${ext}`);
            if (fs.existsSync(fullPath)) return fullPath;
        }
    }
    throw new Error(`Template not found: ${templateName}`);
}

function handleCreate(op) {
    const templatePath = findTemplate(op.template);
    let content = fs.readFileSync(templatePath, 'utf8');

    Object.keys(op.params).forEach(key => {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), op.params[key]);
    });

    // Determine output path based on type (heuristic)
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

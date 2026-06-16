const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Usage:
 * node learn_symbols.cjs [ClassName1] [ClassName2] ...
 * node learn_symbols.cjs --pattern UCMN_*
 * node learn_symbols.cjs --all
 */

async function run() {
    try {
        const args = process.argv.slice(2);
        let fetchAll = args.includes('--all');
        let patterns = args.filter(a => !a.startsWith('--'));
        let globPattern = args.find(a => args[args.indexOf(a) - 1] === '--pattern');

        if (args.length === 0) {
            console.log('Usage:');
            console.log('  node learn_symbols.cjs <ClassName1> [ClassName2] ...');
            console.log('  node learn_symbols.cjs --pattern <RegexPattern>');
            console.log('  node learn_symbols.cjs --all');
            return;
        }

        // 1. Determine local Apex classes
        const sfdxProject = JSON.parse(fs.readFileSync('sfdx-project.json', 'utf8'));
        const localClassNames = new Set();
        
        for (const dir of sfdxProject.packageDirectories) {
            const dirPath = dir.path;
            if (fs.existsSync(dirPath)) {
                const findFiles = (currentPath) => {
                    const files = fs.readdirSync(currentPath);
                    for (const file of files) {
                        const fullPath = path.join(currentPath, file);
                        if (fs.statSync(fullPath).isDirectory()) {
                            findFiles(fullPath);
                        } else if (file.endsWith('.cls')) {
                            localClassNames.add(path.basename(file, '.cls'));
                        }
                    }
                };
                findFiles(dirPath);
            }
        }

        // 2. Get current org info
        const orgInfo = JSON.parse(execSync('sf org display --json', { encoding: 'utf8' }));
        const orgId = orgInfo.result.id;
        console.log(`Querying org: ${orgId} (${orgInfo.result.alias || orgInfo.result.username})`);

        // 3. Construct Query
        let whereClause = `Name NOT IN (${Array.from(localClassNames).map(n => `'${n}'`).join(',')})`;
        
        if (!fetchAll) {
            if (globPattern) {
                // Tooling API supports LIKE but not full regex in WHERE usually, 
                // but we can query then filter in JS for complex patterns.
                // For simplicity, let's just query everything NOT local and filter in JS.
            } else if (patterns.length > 0) {
                whereClause += ` AND Name IN (${patterns.map(p => `'${p}'`).join(',')})`;
            }
        }

        console.log('Fetching ApexClass metadata from org...');
        const queryResult = JSON.parse(execSync(`sf data query --query "SELECT Id, Name FROM ApexClass WHERE ${whereClause}" --use-tooling-api --json`, { encoding: 'utf8' }));
        
        let classesToQuery = queryResult.result.records;

        if (globPattern) {
            const regex = new RegExp('^' + globPattern.replace(/\*/g, '.*') + '$', 'i');
            classesToQuery = classesToQuery.filter(c => regex.test(c.Name));
        }

        console.log(`Found ${classesToQuery.length} matching classes in org that are NOT in the local project.`);

        if (classesToQuery.length === 0) return;

        // 4. Create storage directory
        const storageDir = path.join('.gemini', 'org-symbols', orgId);
        if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
        }

        // 5. Query SymbolTable for each class
        for (const apexClass of classesToQuery) {
            try {
                process.stdout.write(`Fetching SymbolTable for ${apexClass.Name}... `);
                const symbolResult = JSON.parse(execSync(`sf data query --query "SELECT SymbolTable FROM ApexClass WHERE Id = '${apexClass.Id}'" --use-tooling-api --json`, { encoding: 'utf8' }));
                
                const symbolTable = symbolResult.result.records[0].SymbolTable;
                if (symbolTable) {
                    fs.writeFileSync(path.join(storageDir, `${apexClass.Name}.json`), JSON.stringify(symbolTable, null, 2));
                    console.log('Done.');
                } else {
                    console.log('No SymbolTable available.');
                }
            } catch (e) {
                console.log(`Failed: ${e.message}`);
            }
        }

        console.log(`\nFinished. Symbol tables stored in ${storageDir}`);

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

run();

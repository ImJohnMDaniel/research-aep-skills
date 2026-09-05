#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
// Cache + rendering helpers come from skills/_shared/aep_lib.cjs (issue #22).
// The cache is script-private storage (issue #7 / ADR-0002): agents consume
// the summaries this script PRINTS, never the cache files directly.
const { ensureAepCacheDir, renderDescribeSummary } = require('../../_shared/aep_lib.cjs');

/**
 * Usage:
 * node learn_metadata.cjs <SObjectName1> [SObjectName2] ...
 * node learn_metadata.cjs --pattern ACME_*
 * node learn_metadata.cjs --all
 */

async function run() {
    try {
        const args = process.argv.slice(2);
        let fetchAll = args.includes('--all');
        let refresh = args.includes('--refresh');
        let patterns = args.filter(a => !a.startsWith('--'));
        let globPattern = args.find(a => args[args.indexOf(a) - 1] === '--pattern');

        if (args.length === 0) {
            console.log('Usage:');
            console.log('  node learn_metadata.cjs <SObjectName1> [SObjectName2] ...');
            console.log('  node learn_metadata.cjs --pattern <RegexPattern>');
            console.log('  node learn_metadata.cjs --all');
            console.log('  Add --refresh to re-describe objects that are already cached.');
            return;
        }

        // 1. Get current org info
        const orgInfo = JSON.parse(execSync('sf org display --json', { encoding: 'utf8' }));
        const orgId = orgInfo.result.id;
        console.log(`Querying org: ${orgId} (${orgInfo.result.alias || orgInfo.result.username})`);

        // 2. Fetch all SObject names to filter
        console.log('Fetching SObject list from org...');
        const listResult = JSON.parse(execSync('sf sobject list --sobject all --json', { encoding: 'utf8' }));
        let sobjectsToDescribe = listResult.result;

        if (!fetchAll) {
            if (globPattern) {
                const regex = new RegExp('^' + globPattern.replace(/\*/g, '.*') + '$', 'i');
                sobjectsToDescribe = sobjectsToDescribe.filter(name => regex.test(name));
            } else if (patterns.length > 0) {
                const patternSet = new Set(patterns.map(p => p.toLowerCase()));
                sobjectsToDescribe = sobjectsToDescribe.filter(name => patternSet.has(name.toLowerCase()));
            }
        }

        console.log(`Found ${sobjectsToDescribe.length} matching SObjects to describe.`);

        // 3. Create storage directories (project-local, self-gitignoring)
        const baseDir = ensureAepCacheDir(path.join('org-metadata', orgId));

        const subDirs = {
            sobject: path.join(baseDir, 'sobjects'),
            metadata: path.join(baseDir, 'custom-metadata'),
            setting: path.join(baseDir, 'custom-settings')
        };

        Object.values(subDirs).forEach(dir => {
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        });

        const findCached = (name) => Object.values(subDirs)
            .map(dir => path.join(dir, `${name}.json`))
            .find(p => fs.existsSync(p));

        // 4. Describe each SObject
        for (const sobjectName of sobjectsToDescribe) {
            try {
                const cachedPath = refresh ? null : findCached(sobjectName);
                if (cachedPath) {
                    const cached = JSON.parse(fs.readFileSync(cachedPath, 'utf8'));
                    console.log(`\n${renderDescribeSummary(cached)}`);
                    console.log(`(from cache; use --refresh to re-describe)`);
                    continue;
                }
                process.stdout.write(`Describing ${sobjectName}... `);
                const describeResult = JSON.parse(execSync(`sf sobject describe --sobject ${sobjectName} --json`, { encoding: 'utf8' }));
                const describeData = describeResult.result;

                let targetDir = subDirs.sobject;
                if (sobjectName.endsWith('__mdt')) {
                    targetDir = subDirs.metadata;
                } else if (describeData.customSetting) {
                    targetDir = subDirs.setting;
                }

                fs.writeFileSync(path.join(targetDir, `${sobjectName}.json`), JSON.stringify(describeData, null, 2));
                console.log('Done.');
                console.log(`\n${renderDescribeSummary(describeData)}`);
            } catch (e) {
                console.log(`Failed: ${e.message}`);
            }
        }

        console.log(`\nFinished. Metadata stored in ${baseDir}`);

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

run();

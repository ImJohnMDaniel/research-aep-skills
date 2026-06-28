#!/usr/bin/env node
const { execSync } = require("child_process");

console.log("Querying for ApplicationFactory_UnitOfWorkBinding__mdt records...");

try {
    const soql = "SELECT BindingSequence__c, BindingSObject__c, BindingSObjectAlternate__c FROM ApplicationFactory_UnitOfWorkBinding__mdt ORDER BY BindingSequence__c ASC";
    const result = execSync(`sf data query -q "${soql}" --json`).toString();
    const parsedResult = JSON.parse(result);

    if (parsedResult.status === 0 && parsedResult.result.records.length > 0) {
        console.log("Current DML Execution Sequence:");
        console.log("===================================");
        parsedResult.result.records.forEach(record => {
            const objectName = record.BindingSObjectAlternate__c || record.BindingSObject__c || 'N/A';
            console.log(`${record.BindingSequence__c.toString().padEnd(8)} -> ${objectName}`);
        });
        console.log("===================================");

    } else if (parsedResult.status === 0) {
        console.log("No Unit of Work bindings found in the org.");
    } else {
        console.error("Error running SOQL query:");
        console.error(JSON.stringify(parsedResult, null, 2));
    }
} catch (error) {
    console.error("Failed to execute sf data query command.");
    // The sf command will print its own error, so we don't need to double-print it.
}

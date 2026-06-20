const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const componentName = process.argv[2];
const sObjectName = process.argv[3];
const type = process.argv[4]; // Criteria | CriteriaWithExistingRecs | Action | ActionWithExistingRecs | QueueableAction
const operation = process.argv[5] || "After_Insert";
const order = process.argv[6] || "10.1";

if (!componentName || !sObjectName || !type) {
    console.error("Usage: node create_injection.cjs <ComponentName> <SObjectName> <Type> [Operation] [Order]");
    console.error("Types: Criteria, CriteriaWithExistingRecs, Action, ActionWithExistingRecs, QueueableAction");
    process.exit(1);
}

async function run() {
    try {
        const sfdxProject = JSON.parse(fs.readFileSync("sfdx-project.json", "utf8"));
        const defaultDir = sfdxProject.packageDirectories.find(d => d.default).path;
        const apiVersion = sfdxProject.sourceApiVersion || '67.0';

        const skillPath = path.join(__dirname, "..");
        const assetsDir = path.join(skillPath, "assets");

        const subDir = type.includes("Criteria") ? "criteria" : "actions";
        const classPath = path.join(defaultDir, "main", "classes", subDir, `${componentName}.cls`);
        const metaPath = classPath + "-meta.xml";
        const bindingDir = path.join(defaultDir, "main", "schema", "customMetadata", "domainProcessBindings");
        const bindingPath = path.join(bindingDir, `DomainProcessBinding.${componentName}_${operation}.md-meta.xml`);

        // Ensure directories exist
        [path.dirname(classPath), bindingDir].forEach(dir => {
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        });

        // 1. Determine Template
        let templateFile = "ActionTemplate.cls";
        if (type === "Criteria") templateFile = "CriteriaTemplate.cls";
        else if (type === "CriteriaWithExistingRecs") templateFile = "CriteriaWithExistingRecsTemplate.cls";
        else if (type === "ActionWithExistingRecs") templateFile = "ActionWithExistingRecsTemplate.cls";
        else if (type === "QueueableAction") templateFile = "QueueableActionTemplate.cls";

        // 2. Create Class
        let classContent = fs.readFileSync(path.join(assetsDir, templateFile), "utf8");
        classContent = classContent.replace(/{{ClassName}}/g, componentName).replace(/{{SObjectName}}/g, sObjectName);
        fs.writeFileSync(classPath, classContent);
        console.log(`Created Class: ${classPath}`);

        // 3. Create Class Meta
        const classMeta = `<?xml version="1.0" encoding="UTF-8"?>\n<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">\n    <apiVersion>${apiVersion}</apiVersion>\n    <status>Active</status>\n</ApexClass>`;
        fs.writeFileSync(metaPath, classMeta);

        // 4. Create Binding
        let bindingContent = fs.readFileSync(path.join(assetsDir, "BindingTemplate.xml"), "utf8");
        bindingContent = bindingContent
            .replace(/{{Label}}/g, `${componentName} (${operation})`)
            .replace(/{{ClassName}}/g, componentName)
            .replace(/{{SObjectName}}/g, sObjectName)
            .replace(/{{Description}}/g, `Injected ${type} for ${sObjectName} during ${operation}`)
            .replace(/{{ExecuteAsync}}/g, type === "QueueableAction" ? "true" : "false")
            .replace(/{{Order}}/g, order)
            .replace(/{{Operation}}/g, operation)
            .replace(/{{Type}}/g, type.includes("Criteria") ? "Criteria" : "Action");

        fs.writeFileSync(bindingPath, bindingContent);
        console.log(`Created Binding: ${bindingPath}`);

        console.log("\nDeploying changes...");
        execSync("sf project deploy start", { stdio: "inherit" });

    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

run();

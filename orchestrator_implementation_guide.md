# Task-Based Orchestrator: Implementation Guide

## Overview
Currently, the `sf-aep-skills` extension requires the agent to make individual tool calls for every file it creates or modifies. For a standard AT4DX refactor (like moving a Trigger to a Domain Process), this can take 10-12 turns.

The **Task-Based Orchestrator** is a single Node.js script that accepts a **JSON Manifest**. This manifest tells the script to perform multiple operations (Create, Delete, Register) in one go.

## Junior Developer Task List

### 1. Create the Orchestrator Script
Implement `apex_orchestrator.cjs` in the `skills/salesforce-platform-enterprise-architecture/scripts/` directory.

**Requirements for the script:**
- **Input**: Accept a single JSON string as a command-line argument.
- **Validation**: Ensure all referenced templates exist in the `assets/` folders of the various skills.
- **Execution**: 
    - **Create**: Use templates to generate `.cls` and `-meta.xml` files.
    - **Register**: Append or create Custom Metadata XML files (like `DomainProcessBinding__mdt`).
    - **Delete**: Safely remove files from the local filesystem and the Salesforce Org.
- **Output**: Return a summary of all actions taken (Success/Failure).

### 2. Standardize Templates
Ensure the `assets/` directory contains clean templates with standard placeholders like `{{ClassName}}`, `{{SObjectName}}`, and `{{Operation}}`.

### 3. Update Documentation
Update `SKILL.md` to instruct the agent to "Batch operations using `apex_orchestrator.cjs` whenever a task involves more than 2 file changes."

---

## Example Manifest Usage
The agent will run the script like this:

```bash
node apex_orchestrator.cjs '{
  "operations": [
    { 
      "action": "create", 
      "template": "Criteria", 
      "name": "EEORA_UserActivationCriteria", 
      "params": { "SObjectName": "User" } 
    },
    { 
      "action": "create", 
      "template": "QueueableAction", 
      "name": "EEORA_UserActivationAction", 
      "params": { "SObjectName": "User" } 
    },
    { 
      "action": "register", 
      "type": "DomainBinding", 
      "params": { "Class": "EEORA_UserActivationAction", "SObject": "User", "Order": "10.1" } 
    },
    { 
      "action": "delete", 
      "path": "sfdx-source/eeora/main/triggers/EEORA_UserBackfillTrigger.trigger" 
    }
  ]
}'
```

## Benefits
- **Speed**: Reduces 30-minute tasks to 5-10 minutes.
- **Consistency**: Ensures that whenever a class is created, its metadata XML is also created correctly.
- **Safety**: Deletions are handled as part of the atomic batch, preventing "orphaned" code.

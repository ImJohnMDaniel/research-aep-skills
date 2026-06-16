---
name: learn-org-metadata
description: Fetches and stores JSON describes for SObjects, Custom Metadata Types, and Custom Settings from the Salesforce org. Use this to understand the schema (fields, types, relationships) of objects not fully defined in the local project.
---

# Learn Org Metadata

This skill automates the retrieval of SObject describe information (fields, types, picklist values, etc.) and stores it locally for Gemini to reference.

## Workflow

1.  **Identify Targets:** Determine which SObjects, Custom Metadata Types (`__mdt`), or Custom Settings you need to understand.
2.  **Fetch Metadata:** Runs `sf sobject describe` to get the full JSON definition.
3.  **Local Storage:** Categorizes and stores the JSON in `.gemini/org-metadata/<OrgID>/`.

## Usage

To fetch metadata for specific objects:

```bash
# Fetch specific objects
node ./scripts/learn_metadata.cjs Account EEORA_AccommRequest__c

# Fetch using a pattern
node ./scripts/learn_metadata.cjs --pattern "EEORA_*"

# Fetch all (Warning: Very slow)
node ./scripts/learn_metadata.cjs --all
```

## Storage Structure

Data is organized by Org ID and category:

-   `.gemini/org-metadata/<OrgID>/sobjects/`: Standard and Custom Objects.
-   `.gemini/org-metadata/<OrgID>/custom-metadata/`: Custom Metadata Types (`__mdt`).
-   `.gemini/org-metadata/<OrgID>/custom-settings/`: Custom Settings.

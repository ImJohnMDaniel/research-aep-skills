---
name: learn-org-metadata
description: Fetches and stores JSON describes for SObjects, Custom Metadata Types, and Custom Settings from the Salesforce org. Use this to understand the schema (fields, types, relationships) of objects not fully defined in the local project.
---

# Learn Org Metadata

This skill automates the retrieval of SObject describe information (fields, types, picklist values, etc.) and stores it locally for Gemini to reference.

## Workflow

1.  **Identify Targets:** Determine which SObjects, Custom Metadata Types (`__mdt`), or Custom Settings you need to understand.
2.  **Run the script:** It prints a compact field summary of each object to stdout — described via `sf sobject describe` on first request, served from the local cache on subsequent runs (`--refresh` forces a re-describe). **Running the script IS the read**; consume its output directly.
3.  **Do not read the cache files directly.** They live in `.aep/cache/org-metadata/<OrgID>/`, which self-excludes from git (`.aep/.gitignore`); some platforms restrict agent file tools from reading git-ignored paths, so the script's stdout is the supported access path on all platforms.

## Usage

To fetch metadata for specific objects:

```bash
# Fetch specific objects
node ./scripts/learn_metadata.cjs Account ACME_AccommRequest__c

# Fetch using a pattern
node ./scripts/learn_metadata.cjs --pattern "ACME_*"

# Fetch all (Warning: Very slow)
node ./scripts/learn_metadata.cjs --all
```

## Storage Structure

Data is cached (script-private — see Workflow above) organized by Org ID and category:

-   `.aep/cache/org-metadata/<OrgID>/sobjects/`: Standard and Custom Objects.
-   `.aep/cache/org-metadata/<OrgID>/custom-metadata/`: Custom Metadata Types (`__mdt`).
-   `.aep/cache/org-metadata/<OrgID>/custom-settings/`: Custom Settings.

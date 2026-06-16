---
name: learn-org-symbol-table
description: Learns and stores the SymbolTable for specific Apex classes in the current Salesforce org that are not part of the local project source. Use this when you need to understand the API of installed packages or system classes that aren't in the workspace.
---

# Learn Org Symbol Table

This skill automates the discovery of Apex class structures (methods, variables, etc.) for classes existing in the Salesforce org but not in the local project.

## Workflow

1.  **Selection:** Identify which classes or patterns (e.g., `UCMN_*`) you need to learn.
2.  **Fetch Symbols:** Retrieves the `SymbolTable` from the org for the selected classes.
3.  **Local Storage:** Stores the symbol tables as JSON files in `.gemini/org-symbols/<OrgID>/`.

## Usage

To run the learning process for specific classes:

```bash
# Fetch symbols for specific classes
node ./scripts/learn_symbols.cjs ClassName1 ClassName2

# Fetch symbols using a pattern
node ./scripts/learn_symbols.cjs --pattern "UCMN_*"

# Fetch all missing symbols (Warning: Slow)
node ./scripts/learn_symbols.cjs --all
```

## Storage Structure

Symbol data is organized by Org ID to avoid collisions:

`.gemini/org-symbols/<OrgID>/<ClassName>.json`

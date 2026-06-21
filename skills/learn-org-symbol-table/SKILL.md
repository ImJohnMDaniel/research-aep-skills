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

## Best Practices for Efficiency

To avoid excessive load times and token consumption, **always default to the most specific search possible.** Broad, non-specific searches can be extremely slow and costly. Follow this workflow:

1.  **Direct Lookup First:** Always start by searching for the exact, full class name you expect to find.
2.  **Narrow Wildcard Second:** If the direct lookup fails, use a wildcard (`--pattern`) that is as specific as possible (e.g., `"Namespace_*ObjectName*"`).
3.  **Avoid Broad Wildcards:** Using a broad wildcard like `"Namespace_*"` or the `--all` flag should be a last resort only.

## Usage

To run the learning process for specific classes:

**1. Direct Lookup (Preferred)**
```bash
# Fetch symbols for one or more specific, known classes
node ./scripts/learn_symbols.cjs ClassName1 ClassName2
```

**2. Targeted Pattern Search (Use if direct lookup fails)**
```bash
# Fetch symbols using a narrow, specific pattern
node ./scripts/learn_symbols.cjs --pattern "UCMN_*Users*"
```

**3. Broad Search (Avoid if Possible)**
```bash
# Fetch symbols using a broad pattern (Can be very slow)
node ./scripts/learn_symbols.cjs --pattern "UCMN_*"

# Fetch all missing symbols from the org (Extremely slow, use with caution)
node ./scripts/learn_symbols.cjs --all
```

## Storage Structure

Symbol data is organized by Org ID to avoid collisions:

`.gemini/org-symbols/<OrgID>/<ClassName>.json`

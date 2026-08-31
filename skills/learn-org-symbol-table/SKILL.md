---
name: learn-org-symbol-table
description: Learns and stores the SymbolTable for specific Apex classes in the current Salesforce org that are not part of the local project source. Use this when you need to understand the API of installed packages or system classes that aren't in the workspace.
---

# Learn Org Symbol Table

This skill automates the discovery of Apex class structures (methods, variables, etc.) for classes existing in the Salesforce org but not in the local project.

## Workflow

1.  **Selection:** Identify which classes or patterns (e.g., `CMN_*`) you need to learn.
2.  **Run the script:** It prints a compact API summary of each class to stdout — fetched from the org on first request, served from the local cache on subsequent runs (`--refresh` forces a re-fetch). **Running the script IS the read**; consume its output directly.
3.  **Do not read the cache files directly.** They live in `.aep/cache/org-symbols/<OrgID>/`, which self-excludes from git (`.aep/.gitignore`); some platforms restrict agent file tools from reading git-ignored paths, so the script's stdout is the supported access path on all platforms.

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
node ./scripts/learn_symbols.cjs --pattern "CMN_*Users*"
```

**3. Broad Search (Avoid if Possible)**
```bash
# Fetch symbols using a broad pattern (Can be very slow)
node ./scripts/learn_symbols.cjs --pattern "CMN_*"

# Fetch all missing symbols from the org (Extremely slow, use with caution)
node ./scripts/learn_symbols.cjs --all
```

## Storage Structure

Symbol data is cached (script-private — see Workflow above) organized by Org ID to avoid collisions:

`.aep/cache/org-symbols/<OrgID>/<ClassName>.json`

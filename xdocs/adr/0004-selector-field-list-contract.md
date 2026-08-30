# 0004. The selector field list is a contract; generated defaults are curated

- **Status:** Accepted
- **Date:** 2026-08-29
- **Deciders:** @ImJohnMDaniel

## Context

`create_selector.cjs` must choose what to place in a new selector's `getSObjectFieldList()` when no `--fields` flag is given. The draft behavior emitted every field from the org describe merged with local field metadata. Because fflib appends this list to every query the selector runs, an all-fields default drags formulas, long text areas, and system fields into every query forever — a heap and performance liability on wide objects.

A folk belief holds that generated selectors should carry the full field list. The framework author states this is not canon.

## Decision

1. **Canon — the field list contract.** `getSObjectFieldList()` is the selector's *field list contract to the org*: the list of fields the selector **guarantees** will be available on every record it returns. Any additional field a caller needs must be explicitly selected as part of the custom query method (via `fflib_QueryFactory`, e.g. `newQueryFactory().selectField(...)`), on a query-by-query basis.
2. **Curated default generation.** When `--fields` is not provided, the generated contract is built from the org describe merged with local field metadata, **excluding** formula fields, long text areas, rich text areas, blob (base64) fields, and other data types that would inflate the heap by default.
3. **40-field cap.** The generated contract holds at most 40 fields. If more than 40 contract-eligible fields exist, the selector is created with `Id` and `Name` only, and the script warns the user that the contract must be specified manually (`--fields`) because the field count exceeds the recommended maximum.
4. **Explicit lists are honored verbatim.** A `--fields` list *is* the contract the developer is declaring; the script does not filter or cap it.

## Consequences

- The field-list refresh mode (issue #28) must use merge/report semantics that preserve curation — never wholesale regeneration that would overwrite a deliberately declared contract.
- The `manage-apex-selectors` SKILL.md teaches the contract concept: agents verify that fields their logic depends on are either in the contract or explicitly selected in the query method.
- Selector-related guidance elsewhere (linter rules, architecture skill) should adopt the "field list contract" vocabulary.

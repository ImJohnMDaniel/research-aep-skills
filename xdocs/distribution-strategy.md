# sf-aep-skills: Distribution & Update Strategy

One platform-neutral repository (see `xdocs/adr/0002`) distributed through two thin adapters: a Claude Code plugin and a Gemini CLI extension. `build/lint_parity.cjs` enforces manifest parity and skill-content neutrality; run it before every release.

## Installation

### Claude Code (plugin)

The repo carries its own single-plugin marketplace (`.claude-plugin/marketplace.json`):

```
/plugin marketplace add ImJohnMDaniel/research-aep-skills
/plugin install sf-aep-skills@aep-skills
```

Local development / testing without installing:

```bash
claude --plugin-dir /path/to/research-aep-skills
```

(`/reload-plugins` picks up edits without restarting.)

### Gemini CLI (extension)

```bash
gemini extensions install https://github.com/ImJohnMDaniel/research-aep-skills
```

Pin to a tag or branch with `--ref` (e.g., `--ref v0.1.0` for stable, `--ref experimental-claude` for development).

## Update & Release Process

- **Versioning:** Semantic Versioning, kept identical in `.claude-plugin/plugin.json` and `gemini-extension.json` (lint-enforced). Tag releases in git (`v0.1.0`).
- **Updates:** Claude Code — `/plugin` marketplace update flows; Gemini — `gemini extensions update sf-aep-skills` (or install with `--auto-update`).
- **Framework references:** regenerate deliberately via `build/generate_references.cjs` when bumping the pinned commits in `build/framework-sources.json` (see `xdocs/adr/0008`); review the diff like code.
- **Pre-release checklist:** `node build/lint_parity.cjs` green; `node --check` on all scripts; generated references current against the pinned framework commits.

## Future Home

The repository transfers to github.com/apex-enterprise-patterns as it matures (see `xdocs/adr/0001`); install commands change owner only. Additional platforms (e.g., Grok Build) are adapters over the same skill core, per ADR-0002.

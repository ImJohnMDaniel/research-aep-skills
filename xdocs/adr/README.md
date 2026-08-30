# Architecture Decision Records

Decisions of record for the AEP skills project. Conventions:

- **GitHub Discussions** host design debates while they are open.
- A concluded debate produces an ADR here (status `Accepted`), and the ADR spawns implementation issues.
- ADRs are immutable once accepted; a reversal is a new ADR that supersedes the old one.
- Numbering is sequential: `NNNN-short-title.md`. Use [template.md](template.md).

| # | Title | Status |
| --- | --- | --- |
| [0001](0001-repository-and-governance.md) | Repository and governance | Accepted |
| [0002](0002-single-source-portable-core.md) | Single-source portable core with thin platform adapters | Accepted |
| [0003](0003-work-tracking-conventions.md) | Work tracking: Issues, Discussions, ADRs | Accepted |
| [0004](0004-selector-field-list-contract.md) | The selector field list is a contract; generated defaults are curated | Accepted |
| [0005](0005-agent-owns-deployment.md) | Generator scripts never deploy; the agent owns deployment | Accepted |
| [0006](0006-no-batch-orchestrator.md) | No batch orchestrator; the agent orchestrates | Accepted |

# Behavioral eval suite (ADR-0009)

Committed eval cases for the plugin's agent-facing behavior — the layer-3 harness of the testing strategy. Each case is a fixture project plus a probe prompt plus graders, targeting the proven risk scenarios: ownership resolution, onboarding interview compliance (the v0.1 field-finding #3 failures as regression cases), guardrail respect, and refusal-to-guess.

## Layout

```
evals/
  fixtures/                          shared fixture projects (each carries CLAUDE.md
                                     and GEMINI.md so both platforms' runs work)
    at4dx-project-no-hints/          AT4DX deps declared, NO AEP Conventions section
    at4dx-project-with-hints/        full AEP Conventions incl. grouped Dependencies
  <case>/
    prompt.md                        frontmatter (name, tags, runs, max_turns,
                                     allowed_tools) + the probe prompt
    case.yaml                        context.add_dirs -> fixture
    graders/*.md                     regex | tool_used | llm graders
```

## Running

**Native (once `claude plugin eval` early access is enabled):**

```bash
claude plugin eval . --json evals-report.json
```

> Provisional note: the `case.yaml` `add_dirs` fixture-path semantics are written
> to the documented format but unverified until the first gated run — expect to
> confirm (and possibly adjust to a `scaffold_script`) when the gate opens.

**Manual Claude-side protocol (works today):**

```bash
node build/run_probes.cjs            # all cases
node build/run_probes.cjs --case onboarding-no-fabrication
node build/run_probes.cjs --list
```

Regex graders are auto-applied to the transcript; `tool_used` and `llm` graders are listed for human review of the saved transcript (`evals/results-manual/<timestamp>/`). Per ADR-0009, human effort goes to reading failures.

**Manual Gemini-side protocol (on the Gemini machine):** copy a fixture to a scratch directory, open the Gemini CLI there with the extension installed, paste the case's prompt body, and grade the response against the case's graders by hand. Same fixtures, same rubrics, different platform.

## Grading policy

Mechanical graders (`regex`, `tool_used`) wherever the expectation is crisp; `llm` graders only for inherently fuzzy quality judgments. A case passes only if all graders pass. The release gate (ADR-0009): this suite green on Claude, the same fixtures manually green on Gemini, plus layers 1–2 and a clean field-findings log.

## Adding a case

Every field finding that reflects agent behavior should become a regression case here: fixture (reuse or add), prompt reproducing the scenario, graders encoding the ruled-correct behavior. Keep prompts platform-neutral and fixture-relative.

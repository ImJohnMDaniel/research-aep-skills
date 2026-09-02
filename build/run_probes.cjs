#!/usr/bin/env node
/**
 * run_probes.cjs — manual/interim runner for the evals/ suite (ADR-0009).
 *
 * Until `claude plugin eval` is enabled (early access), this runs each eval
 * case as a headless `claude -p` probe on the Claude side: fixture copied to a
 * throwaway directory, plugin loaded from this repo via --plugin-dir, prompt
 * from the case's prompt.md. Regex graders are applied automatically to the
 * transcript; tool_used and llm graders are listed for human review (per
 * ADR-0009, human effort goes to reading failures).
 *
 * Usage:
 *   node build/run_probes.cjs [--case <name>] [--list]
 *
 * Transcripts land in evals/results-manual/<timestamp>/<case>.txt (gitignored).
 * Exit 1 if any auto-graded (regex) check fails.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, execFileSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const EVALS_DIR = path.join(REPO_ROOT, 'evals');

const args = process.argv.slice(2);
const onlyCase = args.includes('--case') ? args[args.indexOf('--case') + 1] : null;
const listOnly = args.includes('--list');

function parseFrontmatter(file) {
    const raw = fs.readFileSync(file, 'utf8');
    const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!m) return { meta: {}, body: raw.trim() };
    const meta = {};
    for (const line of m[1].split('\n')) {
        const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
        if (kv) meta[kv[1]] = kv[2].trim();
    }
    return { meta, body: m[2].trim() };
}

function fixtureFor(caseDir) {
    const caseYaml = path.join(caseDir, 'case.yaml');
    if (!fs.existsSync(caseYaml)) return null;
    const m = fs.readFileSync(caseYaml, 'utf8').match(/add_dirs:\s*\[([^\]]+)\]/);
    if (!m) return null;
    return path.resolve(caseDir, m[1].split(',')[0].trim());
}

function graders(caseDir) {
    const dir = path.join(caseDir, 'graders');
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter(f => f.endsWith('.md')).map(f => {
        const { meta } = parseFrontmatter(path.join(dir, f));
        return { name: f.replace(/\.md$/, ''), ...meta };
    });
}

const cases = fs.readdirSync(EVALS_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory() && fs.existsSync(path.join(EVALS_DIR, e.name, 'prompt.md')))
    .map(e => e.name)
    .filter(n => !onlyCase || n === onlyCase);

if (!cases.length) { console.error(onlyCase ? `No case named ${onlyCase}` : 'No eval cases found.'); process.exit(1); }

if (listOnly) {
    for (const c of cases) {
        const { meta } = parseFrontmatter(path.join(EVALS_DIR, c, 'prompt.md'));
        console.log(`${c}  [fixture: ${path.basename(fixtureFor(path.join(EVALS_DIR, c)) || '-')}, graders: ${graders(path.join(EVALS_DIR, c)).length}, tags: ${meta.tags || '-'}]`);
    }
    process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = path.join(EVALS_DIR, 'results-manual', stamp);
fs.mkdirSync(outDir, { recursive: true });

let failures = 0;
for (const c of cases) {
    const caseDir = path.join(EVALS_DIR, c);
    const { meta, body } = parseFrontmatter(path.join(caseDir, 'prompt.md'));
    const fixture = fixtureFor(caseDir);
    console.log(`\n=== ${c} ===`);
    if (!fixture || !fs.existsSync(fixture)) { console.error(`✖ fixture not found`); failures++; continue; }

    const work = fs.mkdtempSync(path.join(os.tmpdir(), `aep-eval-${c}-`));
    execSync(`cp -R "${fixture}/." "${work}/"`);

    const cliArgs = ['-p', body, '--plugin-dir', REPO_ROOT, '--max-turns', meta.max_turns || '10'];
    const tools = (meta.allowed_tools || '').replace(/[[\]]/g, '').trim();
    if (tools) cliArgs.push('--allowedTools', tools);

    let transcript;
    try {
        transcript = execFileSync('claude', cliArgs, { cwd: work, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 10 * 60 * 1000 });
    } catch (e) {
        transcript = `${e.stdout || ''}\n[PROBE ERROR] ${e.message}`;
    }
    const outFile = path.join(outDir, `${c}.txt`);
    fs.writeFileSync(outFile, transcript);
    console.log(`transcript: ${path.relative(REPO_ROOT, outFile)}`);

    for (const g of graders(caseDir)) {
        if (g.type === 'regex') {
            const re = new RegExp(g.pattern.replace(/^'|'$/g, ''), (g.flags || '').replace(/^'|'$/g, ''));
            const hit = re.test(transcript);
            const pass = (g.match === 'not_contains') ? !hit : hit;
            console.log(`${pass ? '✔' : '✖'} regex ${g.name}`);
            if (!pass) failures++;
        } else {
            console.log(`… ${g.type} ${g.name} — review transcript manually`);
        }
    }
}

console.log(`\n${failures ? `✖ ${failures} auto-graded failure(s)` : '✔ all auto-graded checks passed'} — review the transcripts for the manual graders.`);
process.exit(failures ? 1 : 0);

#!/usr/bin/env node
/**
 * lint_parity.cjs — dual-platform packaging checks (ADR-0002, issue #21).
 *
 * 1. Manifest parity: .claude-plugin/plugin.json, gemini-extension.json, and
 *    the .claude-plugin/marketplace.json entry must agree on name, version
 *    (where present), and description.
 * 2. Platform neutrality: files under skills/ must contain no
 *    platform-specific residue — .gemini paths, .claude paths, platform env
 *    vars, or a context-file reference that names only one platform.
 * 3. Doc integrity: every repo-relative path a SKILL.md references
 *    (assets/, scripts/, references/, xdocs/adr/NNNN) must exist —
 *    catches filename rot mechanically (ADR-0009).
 *
 * Exit code 0 = clean; 1 = violations (each printed with file:line).
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const violations = [];

// --- 1. Manifest parity ------------------------------------------------------
function loadJson(rel) {
    return JSON.parse(fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8'));
}

const plugin = loadJson('.claude-plugin/plugin.json');
const gemini = loadJson('gemini-extension.json');
const marketplace = loadJson('.claude-plugin/marketplace.json');
const marketEntry = (marketplace.plugins || []).find(p => p.name === plugin.name);

if (plugin.name !== gemini.name) violations.push(`manifest parity: plugin.json name "${plugin.name}" != gemini-extension.json name "${gemini.name}"`);
if (plugin.version !== gemini.version) violations.push(`manifest parity: plugin.json version "${plugin.version}" != gemini-extension.json version "${gemini.version}"`);
if (plugin.description !== gemini.description) violations.push('manifest parity: plugin.json and gemini-extension.json descriptions differ');
if (!marketEntry) violations.push(`marketplace.json has no plugin entry named "${plugin.name}"`);
else {
    if (marketEntry.source !== './') violations.push(`marketplace.json entry source is "${marketEntry.source}" (expected "./" for a single-plugin repo)`);
    if (marketEntry.description !== plugin.description) violations.push('marketplace.json entry description differs from plugin.json');
}
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(plugin.name)) violations.push(`plugin name "${plugin.name}" is not kebab-case`);

// --- 2. Platform neutrality over skills/ --------------------------------------
// Each rule: [regex, message, optional line-level exemption regex]
const RULES = [
    [/(~\/)?\.gemini\b/, 'Gemini-specific path (.gemini)'],
    [/(~\/)?\.claude\b/, 'Claude-specific path (.claude)'],
    [/IS_GEMINI_AGENT|IS_CLAUDE_AGENT/, 'platform-identifying environment variable'],
    [/GEMINI\.md/, 'context-file reference naming only Gemini', /CLAUDE\.md/],
    [/CLAUDE\.md/, 'context-file reference naming only Claude', /GEMINI\.md/]
];

function scanFile(filePath) {
    const rel = path.relative(REPO_ROOT, filePath);
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    lines.forEach((line, i) => {
        for (const [pattern, message, exemption] of RULES) {
            if (pattern.test(line) && !(exemption && exemption.test(line))) {
                violations.push(`neutrality: ${rel}:${i + 1} — ${message}`);
            }
        }
    });
}

function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(md|cjs|js|cls|trigger|xml|json)$/.test(entry.name)) scanFile(full);
    }
}
walk(path.join(REPO_ROOT, 'skills'));

// --- 3. Doc integrity: referenced paths must exist -----------------------------
// Scans each skill's SKILL.md for skill-relative path references (assets/,
// scripts/, references/ — negative lookbehind excludes e.g. "aep-references/",
// which lives in consuming projects) and xdocs/adr/NNNN citations. Tokens
// containing placeholders (<...>, {...}, *) never match the pattern.
const skillsRoot = path.join(REPO_ROOT, 'skills');
for (const skill of fs.readdirSync(skillsRoot, { withFileTypes: true }).filter(e => e.isDirectory())) {
    const skillMd = path.join(skillsRoot, skill.name, 'SKILL.md');
    if (!fs.existsSync(skillMd)) { violations.push(`doc integrity: skills/${skill.name}/ has no SKILL.md`); continue; }
    const lines = fs.readFileSync(skillMd, 'utf8').split('\n');
    lines.forEach((line, i) => {
        for (const m of line.matchAll(/(?<![\w/>-])(?:\.\/)?((?:assets|scripts|references)\/[\w./-]+\.[a-z]+)/g)) {
            const target = path.join(skillsRoot, skill.name, m[1]);
            if (!fs.existsSync(target)) violations.push(`doc integrity: skills/${skill.name}/SKILL.md:${i + 1} references missing file ${m[1]}`);
        }
        for (const m of line.matchAll(/xdocs\/adr\/(\d{4})/g)) {
            const hits = fs.readdirSync(path.join(REPO_ROOT, 'xdocs', 'adr')).filter(f => f.startsWith(m[1]));
            if (!hits.length) violations.push(`doc integrity: skills/${skill.name}/SKILL.md:${i + 1} cites nonexistent ADR ${m[1]}`);
        }
    });
}

// --- Report --------------------------------------------------------------------
if (violations.length) {
    console.error(`✖ ${violations.length} violation(s):\n`);
    violations.forEach(v => console.error(`  - ${v}`));
    process.exit(1);
}
console.log('✔ Manifests in parity; skills/ platform-neutral; referenced paths exist.');

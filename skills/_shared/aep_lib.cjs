#!/usr/bin/env node
/**
 * aep_lib.cjs — shared helpers for the sf-aep-skills scripts (issue #22).
 *
 * Single home for logic previously duplicated across the generator, learn,
 * and inventory scripts — the duplication that caused the __Share naming
 * divergence (issue #2). Unit tests live in test/aep_lib.test.cjs and run
 * via `node --test test/` (ADR-0009 layer 1).
 *
 * Pure functions return values/verdicts; callers own console output and
 * process.exit, keeping everything here testable.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const EXEC_OPTS = { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 };

// --- CLI flags -----------------------------------------------------------------
// Supports --key=value, --key value, and bare --key (boolean true); strips
// single/double quotes around =-form values.
function parseFlags(args) {
    const flags = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (!arg.startsWith('--')) continue;
        let key = arg.slice(2);
        let value = true;
        const nextArg = args[i + 1];
        if (key.includes('=')) {
            const eqIndex = key.indexOf('=');
            value = key.substring(eqIndex + 1);
            key = key.substring(0, eqIndex);
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        } else if (nextArg && !nextArg.startsWith('--')) {
            value = nextArg;
            i++;
        }
        flags[key] = value;
    }
    return flags;
}

// --- Naming ----------------------------------------------------------------------
const SOBJECT_SUFFIXES = ["__c", "__pc", "__mdt", "__e", "__Share", "__History", "__ChangeEvent"];

function getPlural(name) {
    let baseName = name;
    let suffix = "";
    for (const s of SOBJECT_SUFFIXES) {
        if (name.endsWith(s)) { baseName = name.slice(0, -s.length); suffix = s; break; }
    }
    // __Share becomes <Base>Shares — without this, the __Share domain/selector
    // name collides with the base SObject's (canon per issue #2 ruling).
    if (suffix === "__Share") return baseName + "Shares";
    if (baseName.endsWith("y")) return baseName.slice(0, -1) + "ies";
    if (/(s|sh|ch|x|z)$/.test(baseName)) return baseName + "es";
    return baseName + "s";
}

function validateIdentifier(name) {
    if (name.includes("__")) {
        throw new Error(`Generated name "${name}" is invalid because it contains a double underscore. Please check the script's naming logic.`);
    }
    if (name.length > 40) {
        throw new Error(`Generated name "${name}" exceeds the 40-character limit for Apex class names.`);
    }
}

function enforceLimit(name, suffix = "") {
    const limit = 40;
    const testSuffix = suffix === "Test" ? "Test" : "";
    if (name.length + testSuffix.length <= limit) return name + testSuffix;
    const parts = name.split("_");
    const prefix = parts[0] + "_";
    const remainder = name.substring(prefix.length);
    const availableSpace = limit - prefix.length - testSuffix.length;
    return prefix + remainder.substring(0, availableSpace) + testSuffix;
}

function isSupportedByMetadataRelationship(name) {
    if (name.endsWith("__c") || name.endsWith("__pc")) return true;
    const unsupported = ["User", "PermissionSet", "PermissionSetGroup"];
    if (unsupported.includes(name)) return false;
    if (name.endsWith("Share")) return false;
    return true;
}

// --- Ownership guardrail (Single-Ownership Principle, ADR-0007 / issue #29) ------
// Pure verdict: { refused: boolean, messages: string[] }. Callers print the
// messages to stderr and exit(1) when refused.
function ownershipGuardrail({ sObjectName, appPrefix, confirmOwnership, layer, injectionPattern }) {
    const isCustomShaped = /__(c|pc|mdt|e|Share|History|ChangeEvent)$/.test(sObjectName);
    const prefixMatch = sObjectName.match(/^([A-Za-z0-9]+)_.+__/);
    const sObjectPrefix = isCustomShaped && prefixMatch ? prefixMatch[1] : null;

    if (!isCustomShaped && !confirmOwnership) {
        return {
            refused: true,
            messages: [
                `ARCHITECTURAL GUARDRAIL: ${sObjectName} is a standard SObject. A ${layer} may be created only in the SObject's owning package.`,
                `Resolve ownership first (project context file's AEP Conventions section + org discovery). If the owner is another package, extend it via ${injectionPattern} instead. If the developer confirms THIS project owns ${sObjectName}, re-run with --confirm-ownership.`
            ]
        };
    }
    if (sObjectPrefix && appPrefix && sObjectPrefix !== appPrefix) {
        return {
            refused: true,
            messages: [
                `ARCHITECTURAL GUARDRAIL: ${sObjectName} carries prefix "${sObjectPrefix}", which is not this project's prefix ("${appPrefix}") — the SObject is owned by another package.`,
                `Do not create a local ${layer} for it. Extend the owning package's ${layer.toLowerCase()} via ${injectionPattern} instead.`
            ]
        };
    }
    return { refused: false, messages: [] };
}

// --- Filesystem -------------------------------------------------------------------
// Create-only semantics (ADR from issue #3): creates from template when missing,
// never modifies existing files. Returns true when it created the file.
function createFileIfMissing(filePath, templateIfMissing) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, templateIfMissing);
        console.log(` - Created: ${filePath}`);
        return true;
    }
    console.log(` - Exists, skipped (existing files are never modified): ${filePath}`);
    return false;
}

// Project-local, self-gitignoring cache (issue #7 / ADR-0002). Script-private
// storage: agents consume printed summaries, never these files directly.
function ensureAepCacheDir(subpath, cwd = process.cwd()) {
    const aepDir = path.join(cwd, '.aep');
    const dir = path.join(aepDir, 'cache', subpath);
    fs.mkdirSync(dir, { recursive: true });
    const selfIgnore = path.join(aepDir, '.gitignore');
    if (!fs.existsSync(selfIgnore)) fs.writeFileSync(selfIgnore, '*\n');
    return dir;
}

function apexMetaXml(type, apiVersion) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<${type} xmlns="http://soap.sforce.com/2006/04/metadata">\n    <apiVersion>${apiVersion}</apiVersion>\n    <status>Active</status>\n</${type}>`;
}

// --- Salesforce CLI ---------------------------------------------------------------
function sfJson(command, { orgFlag = '' } = {}) {
    const parsed = JSON.parse(execSync(`sf ${command} --json${orgFlag}`, EXEC_OPTS));
    if (parsed.status !== 0) throw new Error(`sf ${command} returned status ${parsed.status}`);
    return parsed.result;
}

// --- SymbolTable / describe rendering ---------------------------------------------
function isVisible(modifiers) {
    const mods = modifiers || [];
    return !mods.includes('private') && !mods.includes('testMethod');
}

function signature(m, withReturn) {
    const mods = (m.modifiers || []).join(' ');
    const params = (m.parameters || []).map(p => `${p.type} ${p.name}`).join(', ');
    const ret = withReturn && m.returnType ? `${m.returnType} ` : '';
    return `${mods ? mods + ' ' : ''}${ret}${m.name}(${params})`;
}

// Compact API summary printed to stdout — the supported read path for org
// symbol discovery (issue #7).
function renderSymbolSummary(name, table) {
    const lines = [`## ${name}`];
    const decl = (table.tableDeclaration && table.tableDeclaration.modifiers) || [];
    const lineage = [];
    if (table.parentClass) lineage.push(`extends ${table.parentClass}`);
    if (table.interfaces && table.interfaces.length) lineage.push(`implements ${table.interfaces.join(', ')}`);
    if (decl.length || lineage.length) lines.push(`${decl.join(' ')}${decl.length && lineage.length ? ' — ' : ''}${lineage.join(', ')}`);
    (table.constructors || []).filter(c => isVisible(c.modifiers))
        .forEach(c => lines.push(`- ctor: ${signature(c, false)}`));
    const seenProps = new Set();
    [...(table.properties || []), ...(table.variables || [])]
        .filter(p => isVisible(p.modifiers))
        .filter(p => seenProps.has(p.name) ? false : seenProps.add(p.name))
        .forEach(p => lines.push(`- prop: ${p.type} ${p.name}`));
    (table.methods || []).filter(m => isVisible(m.modifiers))
        .forEach(m => lines.push(`- ${signature(m, true)}`));
    (table.innerClasses || []).filter(ic => isVisible((ic.tableDeclaration || {}).modifiers))
        .forEach(ic => lines.push(`- inner type: ${name}.${ic.name}`));
    return lines.join('\n');
}

// Compact schema summary printed to stdout — the supported read path for org
// metadata discovery (issue #7).
function renderDescribeSummary(describe) {
    const lines = [`## ${describe.name} (${describe.label})`];
    for (const f of describe.fields || []) {
        const refs = (f.referenceTo && f.referenceTo.length) ? ` -> ${f.referenceTo.join(', ')}` : '';
        lines.push(`- ${f.name}: ${f.type}${f.length ? `(${f.length})` : ''}${refs}`);
    }
    return lines.join('\n');
}

module.exports = {
    parseFlags,
    getPlural,
    validateIdentifier,
    enforceLimit,
    isSupportedByMetadataRelationship,
    ownershipGuardrail,
    createFileIfMissing,
    ensureAepCacheDir,
    apexMetaXml,
    sfJson,
    isVisible,
    signature,
    renderSymbolSummary,
    renderDescribeSummary
};

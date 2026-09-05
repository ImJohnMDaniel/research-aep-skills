// Unit tests for skills/_shared/aep_lib.cjs — run via `node --test test/`
// (ADR-0009 layer 1; born with the #22 extraction).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const lib = require('../skills/_shared/aep_lib.cjs');

// --- parseFlags -----------------------------------------------------------------
test('parseFlags: --key=value, quoted values, --key value, bare booleans', () => {
    const flags = lib.parseFlags(['--prefix=ACME', '--fields="Id,Name"', '--group', '10', '--async', '--note=\'x y\'']);
    assert.equal(flags.prefix, 'ACME');
    assert.equal(flags.fields, 'Id,Name');
    assert.equal(flags.group, '10');
    assert.equal(flags.async, true);
    assert.equal(flags.note, 'x y');
});

test('parseFlags: ignores positional args', () => {
    const flags = lib.parseFlags(['Widget__c', '--prefix', 'ACME']);
    assert.deepEqual(flags, { prefix: 'ACME' });
});

// --- getPlural -------------------------------------------------------------------
test('getPlural: standard, custom, y/es rules, and the __Share canon', () => {
    assert.equal(lib.getPlural('User'), 'Users');
    assert.equal(lib.getPlural('Opportunity'), 'Opportunities');
    assert.equal(lib.getPlural('Box'), 'Boxes');
    assert.equal(lib.getPlural('Match'), 'Matches');
    assert.equal(lib.getPlural('ACME_Invoice__c'), 'ACME_Invoices');
    // Issue #2 canon: __Share pluralizes to <Base>Shares, never colliding with the base domain
    assert.equal(lib.getPlural('ACME_Invoice__Share'), 'ACME_InvoiceShares');
    assert.notEqual(lib.getPlural('ACME_Invoice__Share'), lib.getPlural('ACME_Invoice__c'));
    assert.equal(lib.getPlural('AccountShare'), 'AccountShares');
    assert.equal(lib.getPlural('ACME_Config__mdt'), 'ACME_Configs');
});

// --- enforceLimit / validateIdentifier --------------------------------------------
test('enforceLimit: under limit unchanged; Test suffix; over-limit truncates after prefix', () => {
    assert.equal(lib.enforceLimit('ACME_Invoices'), 'ACME_Invoices');
    assert.equal(lib.enforceLimit('ACME_Invoices', 'Test'), 'ACME_InvoicesTest');
    const long = 'ACME_' + 'A'.repeat(45);
    const out = lib.enforceLimit(long, 'Test');
    assert.equal(out.length, 40);
    assert.ok(out.startsWith('ACME_'));
    assert.ok(out.endsWith('Test'));
});

test('validateIdentifier: rejects double underscores and >40 chars', () => {
    assert.throws(() => lib.validateIdentifier('ACME__Bad'));
    assert.throws(() => lib.validateIdentifier('X'.repeat(41)));
    assert.doesNotThrow(() => lib.validateIdentifier('ACME_Invoices'));
});

// --- isSupportedByMetadataRelationship ---------------------------------------------
test('isSupportedByMetadataRelationship: platform restrictions encoded', () => {
    assert.equal(lib.isSupportedByMetadataRelationship('ACME_Invoice__c'), true);
    assert.equal(lib.isSupportedByMetadataRelationship('Account'), true);
    assert.equal(lib.isSupportedByMetadataRelationship('User'), false);
    assert.equal(lib.isSupportedByMetadataRelationship('PermissionSet'), false);
    assert.equal(lib.isSupportedByMetadataRelationship('AccountShare'), false);
    assert.equal(lib.isSupportedByMetadataRelationship('ACME_Invoice__Share'), false);
});

// --- ownershipGuardrail -------------------------------------------------------------
const g = (o) => lib.ownershipGuardrail({ layer: 'Selector', injectionPattern: 'Selector Method Injection', ...o });

test('guardrail: standard SObject without confirmation is refused', () => {
    const v = g({ sObjectName: 'User', appPrefix: 'ACME', confirmOwnership: false });
    assert.equal(v.refused, true);
    assert.match(v.messages[0], /ARCHITECTURAL GUARDRAIL: User is a standard SObject/);
    assert.match(v.messages[1], /--confirm-ownership/);
});

test('guardrail: standard SObject with confirmation passes', () => {
    assert.equal(g({ sObjectName: 'User', appPrefix: 'ACME', confirmOwnership: true }).refused, false);
});

test('guardrail: another package prefix is refused, own prefix passes', () => {
    const foreign = g({ sObjectName: 'CMN_Log__c', appPrefix: 'ACME', confirmOwnership: false });
    assert.equal(foreign.refused, true);
    assert.match(foreign.messages[0], /prefix "CMN"/);
    assert.match(foreign.messages[1], /Selector Method Injection/);
    assert.equal(g({ sObjectName: 'ACME_Invoice__c', appPrefix: 'ACME', confirmOwnership: false }).refused, false);
});

test('guardrail: unprefixed custom object passes (assumed local)', () => {
    assert.equal(g({ sObjectName: 'Widget__c', appPrefix: 'ACME', confirmOwnership: false }).refused, false);
});

// --- rendering ---------------------------------------------------------------------
test('renderSymbolSummary: dedupes properties, filters private, keeps interface methods, lists inners', () => {
    const out = lib.renderSymbolSummary('Rich', {
        tableDeclaration: { modifiers: ['public', 'abstract'] },
        parentClass: 'fflib_SObjectSelector',
        interfaces: ['IX'],
        constructors: [{ name: 'Rich', modifiers: ['public'], parameters: [] }],
        properties: [{ name: 'records', type: 'List<SObject>', modifiers: [] }],
        variables: [
            { name: 'records', type: 'List<SObject>', modifiers: [] },
            { name: 'secret', type: 'String', modifiers: ['private'] }
        ],
        methods: [
            { name: 'selectById', modifiers: ['public'], returnType: 'List<User>', parameters: [{ type: 'Set<Id>', name: 'ids' }] },
            { name: 'ifaceMethod', modifiers: [], returnType: 'void', parameters: [] }
        ],
        innerClasses: [{ name: 'Inner', tableDeclaration: { modifiers: ['public'] } }]
    });
    assert.equal((out.match(/prop: List<SObject> records/g) || []).length, 1);
    assert.ok(!out.includes('secret'));
    assert.ok(out.includes('public List<User> selectById(Set<Id> ids)'));
    assert.ok(out.includes('void ifaceMethod()'));
    assert.ok(out.includes('inner type: Rich.Inner'));
    assert.ok(out.includes('extends fflib_SObjectSelector, implements IX'));
});

test('renderDescribeSummary: fields with length and references', () => {
    const out = lib.renderDescribeSummary({
        name: 'ACME_Invoice__c', label: 'Invoice',
        fields: [
            { name: 'Name', type: 'string', length: 80 },
            { name: 'Account__c', type: 'reference', referenceTo: ['Account'] }
        ]
    });
    assert.ok(out.includes('## ACME_Invoice__c (Invoice)'));
    assert.ok(out.includes('- Name: string(80)'));
    assert.ok(out.includes('- Account__c: reference -> Account'));
});

// --- filesystem ---------------------------------------------------------------------
test('ensureAepCacheDir: creates self-gitignoring cache under cwd', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'aep-lib-test-'));
    const dir = lib.ensureAepCacheDir(path.join('org-symbols', 'ORGID'), tmp);
    assert.ok(fs.existsSync(dir));
    assert.equal(fs.readFileSync(path.join(tmp, '.aep', '.gitignore'), 'utf8'), '*\n');
    fs.rmSync(tmp, { recursive: true, force: true });
});

test('createFileIfMissing: creates once, never overwrites', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'aep-lib-test-'));
    const f = path.join(tmp, 'X.cls');
    assert.equal(lib.createFileIfMissing(f, 'original'), true);
    assert.equal(lib.createFileIfMissing(f, 'CLOBBER'), false);
    assert.equal(fs.readFileSync(f, 'utf8'), 'original');
    fs.rmSync(tmp, { recursive: true, force: true });
});

// --- meta xml -----------------------------------------------------------------------
test('apexMetaXml: class and trigger shapes', () => {
    const cls = lib.apexMetaXml('ApexClass', '61.0');
    assert.ok(cls.includes('<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">'));
    assert.ok(cls.includes('<apiVersion>61.0</apiVersion>'));
    assert.ok(lib.apexMetaXml('ApexTrigger', '61.0').includes('</ApexTrigger>'));
});

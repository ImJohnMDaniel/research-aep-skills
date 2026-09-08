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
// Provenance: Salesforce Help, custommetadatatypes_relationships_limits.htm
// (release 260) — see the list and criteria comments in aep_lib.cjs (issue #17).
test('isSupportedByMetadataRelationship: supported entities', () => {
    assert.equal(lib.isSupportedByMetadataRelationship('ACME_Invoice__c'), true);
    assert.equal(lib.isSupportedByMetadataRelationship('Account'), true);
    assert.equal(lib.isSupportedByMetadataRelationship('Contact'), true);
    assert.equal(lib.isSupportedByMetadataRelationship('Case'), true);
});

test('isSupportedByMetadataRelationship: Help-page explicit unsupported list', () => {
    for (const name of ['User', 'PermissionSet', 'Task', 'Event', 'Activity', 'Holiday',
        'Group', 'GroupMember', 'UserRole', 'QueueSObject', 'FieldPermissions',
        'ObjectPermissions', 'PermissionSetAssignment', 'SetupEntityAccess',
        'Territory', 'Territory2', 'Territory2Model', 'UserTerritory', 'SignupRequest']) {
        assert.equal(lib.isSupportedByMetadataRelationship(name), false, name);
    }
});

test('isSupportedByMetadataRelationship: criteria-derived and empirical exclusions', () => {
    assert.equal(lib.isSupportedByMetadataRelationship('PermissionSetGroup'), false);
    // System tables: share/history/change-event/feed, standard and custom-suffixed
    assert.equal(lib.isSupportedByMetadataRelationship('AccountShare'), false);
    assert.equal(lib.isSupportedByMetadataRelationship('ACME_Invoice__Share'), false);
    assert.equal(lib.isSupportedByMetadataRelationship('AccountHistory'), false);
    assert.equal(lib.isSupportedByMetadataRelationship('ACME_Invoice__History'), false);
    assert.equal(lib.isSupportedByMetadataRelationship('AccountChangeEvent'), false);
    assert.equal(lib.isSupportedByMetadataRelationship('ACME_Invoice__ChangeEvent'), false);
    assert.equal(lib.isSupportedByMetadataRelationship('AccountFeed'), false);
    // Empirical (original skill draft), kept under the fail-safe bias
    assert.equal(lib.isSupportedByMetadataRelationship('ContentDocument'), false);
    assert.equal(lib.isSupportedByMetadataRelationship('ContentVersion'), false);
    assert.equal(lib.isSupportedByMetadataRelationship('ContentDocumentLink'), false);
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

// --- field-list contract surgery (issue #28) ------------------------------------------
const SELECTOR_CLS = `public inherited sharing class ACME_WidgetsSelector
    extends ApplicationSObjectSelector
{
    public override List<Schema.SObjectField> getSObjectFieldList()
    {
        return new List<Schema.SObjectField> {
            ACME_Widget__c.Id,
            ACME_Widget__c.Name
        };
    }

    public Schema.SObjectType getSObjectType()
    {
        return ACME_Widget__c.SObjectType;
    }
}`;

test('parseSObjectFieldList: parses the generated shape, brace-on-same-line variant, empty list', () => {
    const parsed = lib.parseSObjectFieldList(SELECTOR_CLS, 'ACME_Widget__c');
    assert.equal(parsed.ok, true);
    assert.deepEqual(parsed.fields.map(f => f.field), ['Id', 'Name']);
    assert.equal(parsed.entryIndent, '            ');

    const sameLine = SELECTOR_CLS.replace('getSObjectFieldList()\n    {', 'getSObjectFieldList() {');
    assert.equal(lib.parseSObjectFieldList(sameLine, 'ACME_Widget__c').ok, true);

    const empty = 'class X { public override List<Schema.SObjectField> getSObjectFieldList() { return new List<Schema.SObjectField> {}; } }';
    const parsedEmpty = lib.parseSObjectFieldList(empty);
    assert.equal(parsedEmpty.ok, true);
    assert.equal(parsedEmpty.fields.length, 0);
});

test('parseSObjectFieldList: shape gate refuses custom logic, non-token entries, wrong SObject, missing method', () => {
    const customLogic = SELECTOR_CLS.replace('return new', 'if (someFlag) return other();\n        return new');
    assert.equal(lib.parseSObjectFieldList(customLogic).ok, false);
    assert.match(lib.parseSObjectFieldList(customLogic).reason, /not a single/);

    const commented = SELECTOR_CLS.replace('ACME_Widget__c.Id,', 'ACME_Widget__c.Id, // key\n');
    assert.equal(lib.parseSObjectFieldList(commented).ok, false);

    const foreign = lib.parseSObjectFieldList(SELECTOR_CLS, 'Account');
    assert.equal(foreign.ok, false);
    assert.match(foreign.reason, /other than Account/);

    assert.equal(lib.parseSObjectFieldList('class X { void other() {} }').ok, false);
});

test('replaceSObjectFieldList: rewrites only the list, preserving indentation and the rest of the class', () => {
    const out = lib.replaceSObjectFieldList(SELECTOR_CLS, 'ACME_Widget__c', ['Id', 'Name', 'Status__c']);
    assert.equal(out.ok, true);
    assert.ok(out.content.includes('            ACME_Widget__c.Status__c\n        };'));
    assert.ok(out.content.includes('            ACME_Widget__c.Id,\n            ACME_Widget__c.Name,'));
    // Everything outside the list is byte-identical
    assert.ok(out.content.includes('return ACME_Widget__c.SObjectType;'));
    assert.equal(out.content.split('getSObjectFieldList').length, SELECTOR_CLS.split('getSObjectFieldList').length);
    // Round-trips through the parser
    const reparsed = lib.parseSObjectFieldList(out.content, 'ACME_Widget__c');
    assert.deepEqual(reparsed.fields.map(f => f.field), ['Id', 'Name', 'Status__c']);
});

test('replaceSObjectFieldList: propagates the shape-gate refusal', () => {
    const out = lib.replaceSObjectFieldList('class X {}', 'Y__c', ['Id']);
    assert.equal(out.ok, false);
});

// --- meta xml -----------------------------------------------------------------------
test('apexMetaXml: class and trigger shapes', () => {
    const cls = lib.apexMetaXml('ApexClass', '61.0');
    assert.ok(cls.includes('<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">'));
    assert.ok(cls.includes('<apiVersion>61.0</apiVersion>'));
    assert.ok(lib.apexMetaXml('ApexTrigger', '61.0').includes('</ApexTrigger>'));
});

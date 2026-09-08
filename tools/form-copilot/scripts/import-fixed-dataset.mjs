// Read-only XLSX extraction. Requires the bundled @oai/artifact-tool runtime,
// not a workbook-authoring dependency in this application's production image.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const option = (name) => args[args.indexOf(name) + 1];
const validSource = option('--valid-source') || option('--source');
const invalidSource = option('--invalid-source');
const modules = option('--artifact-modules') || process.env.ARTIFACT_TOOL_NODE_MODULES;
if (!validSource || !invalidSource || !modules) {
  throw new Error('Usage: node scripts/import-fixed-dataset.mjs --valid-source valid.csv --invalid-source invalid.xlsx --artifact-modules /bundled/node_modules [--inspect] [--capture-form]');
}
const requireBundled = createRequire(path.join(path.resolve(modules), '..', '__fixed_dataset_import__.mjs'));
const { FileBlob, SpreadsheetFile, Workbook } = await import(pathToFileURL(requireBundled.resolve('@oai/artifact-tool')).href);
const validWorkbook = await Workbook.fromCSV(await fs.readFile(validSource, 'utf8'), { sheetName: 'VALID_519' });
const invalidWorkbook = await SpreadsheetFile.importXlsx(await FileBlob.load(invalidSource));
const readTable = (sheet, range) => {
  const workbook = sheet === 'VALID_519' ? validWorkbook : invalidWorkbook;
  const [header, ...values] = workbook.worksheets.getItem(sheet).getRange(range).values;
  const columns = header.map((value) => String(value ?? '').trim());
  if (columns.some((name) => !name) || new Set(columns).size !== columns.length) throw new Error(`${sheet}: invalid headers`);
  return { columns, records: values.map((row) => Object.fromEntries(columns.map((name, index) => [name, String(row[index] ?? '').trim()]))) };
};
const valid = readTable('VALID_519', 'A1:AT520');
const invalid = readTable('INVALID_104', 'A1:BA104');
const screening = ['Consent', 'S0', 'S1', 'S2', 'S3', 'S4', 'S5'];
const passingScreening = { Consent: '1', S0: '1', S1: '1', S2: '1', S3: '1', S4: '1', S5: '0' };
const demographics = ['D1_Age', 'D2_Gender', 'D3_Status'];
const demographicValues = {
  D1_Age: ['18-22', '23-27', '28-34', '35+'],
  D2_Gender: ['Female', 'Male', 'Other', 'Prefer not to say'],
  D3_Status: ['Student', 'Working', 'Both studying and working', 'Other'],
};
const canonicalValue = (name, value) => name === 'D3_Status' && value === 'Both' ? 'Both studying and working' : value;
const items = valid.columns.filter((name) => name !== 'Synthetic_ID' && !demographics.includes(name));
if (items.length !== 42 || !items.every((name) => /^[A-Z]{2,3}[1-5]$/.test(name))) throw new Error('Unexpected 42-item response schema');
const indexById = (records, label) => {
  const index = new Map();
  for (const row of records) {
    if (!row.Synthetic_ID || index.has(row.Synthetic_ID)) throw new Error(`${label}: duplicate or blank Synthetic_ID`);
    index.set(row.Synthetic_ID, row);
  }
  return index;
};
indexById(valid.records, 'VALID_519');
indexById(invalid.records, 'INVALID_104');
if (valid.records.length !== 519) throw new Error('Source must contain exactly 519 valid records');
if (invalid.records.length !== 103) throw new Error('Source must contain exactly 103 invalid records');
const fields = [...screening, ...items, ...demographics];
if (JSON.stringify(invalid.columns) !== JSON.stringify(['Synthetic_ID', ...fields])) throw new Error('Invalid source headers do not match the fixed form schema');
const validRows = valid.records.map((row) => {
  const answers = { ...passingScreening, ...Object.fromEntries([...items, ...demographics].map((name) => [name, row[name]])) };
  for (const name of items) if (!/^[1-5]$/.test(answers[name])) throw new Error(`Invalid completing response: ${row.Synthetic_ID}/${name}`);
  for (const name of demographics) if (!demographicValues[name].includes(answers[name])) throw new Error(`Invalid completing response: ${row.Synthetic_ID}/${name}`);
  return {
    id: row.Synthetic_ID,
    answers,
    sourceStatus: 'VALID',
    sourceExclusionReason: null,
  };
});
const reasonFor = (answers) => {
  const reasons = { Consent: 'Consent declined', S0: 'Under 18', S1: 'Not living in Vietnam', S2: 'Inactive social media', S3: 'Not interested in online IT learning', S4: 'No prior StarCi exposure', S5: 'Already registered/paid/started/completed' };
  for (const name of screening) {
    if (answers[name] !== passingScreening[name]) return reasons[name];
  }
  const values = items.map((name) => answers[name]);
  if (values.length === 42 && values.every((value) => value === values[0])) return 'Straight-lining';
  throw new Error('Invalid row has neither a screening exclusion nor the declared straight-line QC exclusion');
};
const invalidRows = invalid.records.map((row) => {
  const answers = Object.fromEntries(fields.filter((name) => row[name] !== '').map((name) => [name, canonicalValue(name, row[name])]));
  const firstBlank = screening.findIndex((name) => answers[name] === undefined);
  if (firstBlank >= 0 && screening.slice(firstBlank).some((name) => answers[name] !== undefined)) throw new Error(`Non-prefix screening answers: ${row.Synthetic_ID}`);
  for (const name of items) if (answers[name] !== undefined && !/^[1-5]$/.test(answers[name])) throw new Error(`Invalid matrix response: ${row.Synthetic_ID}/${name}`);
  for (const name of demographics) if (answers[name] !== undefined && !demographicValues[name].includes(answers[name])) throw new Error(`Invalid demographic response: ${row.Synthetic_ID}/${name}`);
  return { id: row.Synthetic_ID, answers, sourceStatus: 'INVALID', sourceExclusionReason: reasonFor(answers) };
});
const rows = [...validRows, ...invalidRows];
if (new Set(rows.map((row) => row.id)).size !== rows.length) throw new Error('Duplicate Synthetic_ID across valid and invalid sources');
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const validSourceDigest = sha256(await fs.readFile(validSource));
const invalidSourceDigest = sha256(await fs.readFile(invalidSource));
const rowDigest = sha256(JSON.stringify(rows));
const artifact = {
  schemaVersion: 4,
  name: 'MGT400 synthetic valid + invalid rehearsal dataset',
  synthetic: true,
  label: 'Synthetic rehearsal only — not empirical survey findings or evidence of real respondents\' consent.',
  source: { files: [
    { role: 'valid', fileName: path.basename(validSource), sha256: validSourceDigest, format: 'csv', ranges: ['VALID_519!A1:AT520'] },
    { role: 'invalid', fileName: path.basename(invalidSource), sha256: invalidSourceDigest, format: 'xlsx', ranges: ['INVALID_104!A1:BA104'] },
  ], join: 'Synthetic_ID', derivedScreening: passingScreening, canonicalization: { 'D3_Status:Both': 'Both studying and working' } },
  reconciliation: { sourceCount: 622, validCount: 519, invalidCount: 103, completingCount: 526, screenedOutCount: 96, qualityControlInvalidCount: 7, runnableCount: 622 },
  digest: rowDigest,
  fields,
  rows,
};
if (args.includes('--inspect')) {
  console.log(JSON.stringify({ ...artifact, rows: undefined }, null, 2));
} else {
  const output = fileURLToPath(new URL('../apps/api/data/', import.meta.url));
  await fs.mkdir(output, { recursive: true });
  await fs.writeFile(path.join(output, 'fixed-dataset.json'), `${JSON.stringify(artifact, null, 2)}\n`);
  console.log(JSON.stringify({ rows: rows.length, fields: fields.length, validSourceDigest, invalidSourceDigest, rowDigest }));
}

// Explicit read-only schema capture. No browser, no clicks, no formResponse POST.
// Review any change to this pin before allowing workers to use a new form schema.
if (args.includes('--capture-form')) {
  const formId = '18jAiCr6Q7bz6sQA5kH1SW53aPW6L_jzzp8m8UgJkPIk';
  const url = `https://docs.google.com/forms/d/${formId}/viewform`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Form metadata HTTP ${response.status}`);
  const html = await response.text();
  const match = html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) throw new Error('Public form schema unavailable');
  const metadata = JSON.parse(match[1]);
  const structure = {
    title: metadata[1][8],
    items: metadata[1][1].map((item) => ({ id: item[0], title: item[1], description: item[2] ?? null, type: item[3], entries: item[4] ?? null, next: item[5] ?? null })),
  };
  const output = new URL('../apps/api/data/fixed-form-schema.json', import.meta.url);
  await fs.writeFile(output, `${JSON.stringify({ formId, resolvedUrl: response.url, observedAt: new Date().toISOString(), observation: 'Public GET only; browser traversal and live submission not verified.', sha256: sha256(JSON.stringify(structure)), structure }, null, 2)}\n`);
  console.log(JSON.stringify({ formStatus: response.status, resolvedUrl: response.url, structureDigest: sha256(JSON.stringify(structure)), pageBreaks: structure.items.filter((item) => item.type === 8).length }));
}

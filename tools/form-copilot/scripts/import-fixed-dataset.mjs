// Read-only XLSX extraction. Requires the bundled @oai/artifact-tool runtime,
// not a workbook-authoring dependency in this application's production image.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const option = (name) => args[args.indexOf(name) + 1];
const source = option('--source');
const modules = option('--artifact-modules') || process.env.ARTIFACT_TOOL_NODE_MODULES;
if (!args.includes('--source') || !source || !modules) {
  throw new Error('Usage: node scripts/import-fixed-dataset.mjs --source valid.csv --artifact-modules /bundled/node_modules [--inspect] [--capture-form]');
}
const requireBundled = createRequire(path.join(path.resolve(modules), '..', '__fixed_dataset_import__.mjs'));
const { FileBlob, SpreadsheetFile, Workbook } = await import(pathToFileURL(requireBundled.resolve('@oai/artifact-tool')).href);
const isCsv = path.extname(source).toLowerCase() === '.csv';
const wb = isCsv
  ? await Workbook.fromCSV(await fs.readFile(source, 'utf8'), { sheetName: 'VALID_519' })
  : await SpreadsheetFile.importXlsx(await FileBlob.load(source));
const readTable = (sheet, range) => {
  const [header, ...values] = wb.worksheets.getItem(sheet).getRange(range).values;
  const columns = header.map((value) => String(value ?? '').trim());
  if (columns.some((name) => !name) || new Set(columns).size !== columns.length) throw new Error(`${sheet}: invalid headers`);
  return { columns, records: values.map((row) => Object.fromEntries(columns.map((name, index) => [name, String(row[index] ?? '').trim()]))) };
};
const valid = readTable('VALID_519', 'A1:AT520');
const screening = ['Consent', 'S0', 'S1', 'S2', 'S3', 'S4', 'S5'];
const passingScreening = { Consent: '1', S0: '1', S1: '1', S2: '1', S3: '1', S4: '1', S5: '0' };
const demographics = ['D1_Age', 'D2_Gender', 'D3_Status'];
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
if (valid.records.length !== 519) throw new Error('Source must contain exactly 519 valid records');
const fields = [...screening, ...items, ...demographics];
const rows = valid.records.map((row) => {
  const answers = { ...passingScreening, ...Object.fromEntries([...items, ...demographics].map((name) => [name, row[name]])) };
  for (const name of items) if (!/^[1-5]$/.test(answers[name])) throw new Error(`Invalid completing response: ${row.Synthetic_ID}/${name}`);
  for (const name of demographics) if (!answers[name]) throw new Error(`Missing completing response: ${row.Synthetic_ID}/${name}`);
  return {
    id: row.Synthetic_ID,
    answers,
    sourceStatus: 'VALID',
    sourceExclusionReason: null,
  };
});
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const sourceDigest = sha256(await fs.readFile(source));
const rowDigest = sha256(JSON.stringify(rows));
const artifact = {
  schemaVersion: 3,
  name: path.basename(source),
  synthetic: true,
  label: 'Synthetic rehearsal only — not empirical survey findings or evidence of real respondents\' consent.',
  source: { fileName: path.basename(source), sha256: sourceDigest, format: isCsv ? 'csv' : 'xlsx', ranges: ['VALID_519!A1:AT520'], join: 'Synthetic_ID', derivedScreening: passingScreening },
  reconciliation: { sourceCount: 519, completingCount: 519, screenedOutCount: 0, eligibleCount: 519, excludedCount: 0 },
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
  console.log(JSON.stringify({ rows: rows.length, fields: fields.length, sourceDigest, rowDigest }));
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

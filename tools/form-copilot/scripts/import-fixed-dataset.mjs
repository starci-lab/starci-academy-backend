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
  throw new Error('Usage: node scripts/import-fixed-dataset.mjs --source workbook.xlsx --artifact-modules /bundled/node_modules [--inspect] [--capture-form]');
}
const requireBundled = createRequire(path.join(path.resolve(modules), '..', '__fixed_dataset_import__.mjs'));
const { FileBlob, SpreadsheetFile } = await import(pathToFileURL(requireBundled.resolve('@oai/artifact-tool')).href);
const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(source));
const readTable = (sheet, range) => {
  const [header, ...values] = wb.worksheets.getItem(sheet).getRange(range).values;
  const columns = header.map((value) => String(value ?? '').trim());
  if (columns.some((name) => !name) || new Set(columns).size !== columns.length) throw new Error(`${sheet}: invalid headers`);
  return { columns, records: values.map((row) => Object.fromEntries(columns.map((name, index) => [name, String(row[index] ?? '').trim()]))) };
};
const merged = readTable('MERGED_639_REHEARSAL', 'A1:BB640');
const mapping = readTable('Row_Mapping', 'A1:D640');
const MAPPING_COLUMNS = ['Excel row in merged / file 2', 'Classification', 'Valid order in file 1', 'Synthetic source ID'];
if (JSON.stringify(mapping.columns) !== JSON.stringify(MAPPING_COLUMNS)) throw new Error('Unexpected row-mapping schema');
const screening = ['Consent', 'S0', 'S1', 'S2', 'S3', 'S4', 'S5'];
const demographics = ['D1_Age', 'D2_Gender', 'D3_Status'];
const items = [
  ...[1, 2, 3, 4].map((number) => `SMC${number}`),
  ...[1, 2, 3].map((number) => `ENT${number}`),
  ...[1, 2, 3, 4].map((number) => `INF${number}`),
  ...[1, 2, 3].map((number) => `INT${number}`),
  ...[1, 2, 3, 4].map((number) => `CRE${number}`),
  'SMM_OVERALL',
  ...['BT', 'EI', 'OPT', 'INN', 'DIS', 'INS'].flatMap((prefix) => [1, 2, 3, 4].map((number) => `${prefix}${number}`)),
];
const sourceHeaders = {
  Consent: 'I have read the information above and voluntarily agree to participate. / Tôi đã đọc thông tin trên và tự nguyện đồng ý tham gia.',
  S0: '[S0] Are you 18 years old or above? / Bạn có từ đủ 18 tuổi trở lên không?',
  S1: '[S1] Do you currently live in Vietnam? / Bạn hiện đang sinh sống tại Việt Nam không?',
  S2: '[S2] Do you actively use social media (e.g., Facebook, TikTok, Instagram, YouTube)? / Bạn có thường xuyên sử dụng mạng xã hội (ví dụ: Facebook, TikTok, Instagram, YouTube) không?',
  S3: '[S3] Are you interested in learning IT-related knowledge or skills through online courses? / Bạn có quan tâm đến việc học kiến thức hoặc kỹ năng CNTT thông qua các khóa học trực tuyến không?',
  S4: '[S4] Before taking this survey, had you previously seen social media content from StarCi Academy? / Trước khi bắt đầu khảo sát này, bạn đã từng xem nội dung trên mạng xã hội của StarCi Academy chưa?',
  S5: '[S5] Have you already registered for, paid for, started, or completed a course at StarCi Academy? / Bạn đã từng đăng ký, thanh toán, bắt đầu học hoặc hoàn thành một khóa học tại StarCi Academy chưa?',
  D1_Age: 'Độ tuổi của bạn? / Your age group?',
  D2_Gender: 'Giới tính / Gender',
  D3_Status: 'Hiện tại bạn thuộc nhóm nào? / What is your current status?',
};
const expectedHeaders = ['Dấu thời gian', ...screening.map((name) => sourceHeaders[name]), ...items, ...demographics.map((name) => sourceHeaders[name])];
if (JSON.stringify(merged.columns) !== JSON.stringify(expectedHeaders)) throw new Error('Unexpected merged response schema');
if (merged.records.length !== 639 || mapping.records.length !== 639) throw new Error('Source record counts changed');
const fields = [...screening, ...items, ...demographics];
const yesNo = { 'Yes / Có': '1', 'No / Không': '0' };
const demographicValues = {
  D1_Age: { '18-22': '18-22', '23-27': '23-27', '28-34': '28-34', '35 trở lên / 35+': '35+' },
  D2_Gender: { 'Nữ / Female': 'Female', 'Nam / Male': 'Male', 'Khác / Other': 'Other', 'Không muốn trả lời / Prefer not to say': 'Prefer not to say' },
  D3_Status: { 'Học sinh / Sinh viên (Student)': 'Student', 'Đi làm (Working)': 'Working', 'Vừa học vừa làm (Both)': 'Both studying and working', 'Khác (Other)': 'Other' },
};
const seenValidIds = new Set();
let invalidOrdinal = 0;
const rows = merged.records.map((row, index) => {
  const sourceRow = index + 2;
  const sourceMap = mapping.records[index];
  if (sourceMap[MAPPING_COLUMNS[0]] !== String(sourceRow)) throw new Error(`Row mapping mismatch: ${sourceRow}`);
  const classification = sourceMap[MAPPING_COLUMNS[1]];
  const isValid = classification === 'Valid';
  const isScreening = classification.startsWith('Screening: ');
  const isQualityExcluded = classification === 'QC: straight-line';
  if (!isValid && !isScreening && !isQualityExcluded) throw new Error(`Unsupported classification: ${classification}`);
  const sourceId = sourceMap[MAPPING_COLUMNS[3]];
  if (isValid) {
    if (!/^SYN-V\d{3}$/.test(sourceId) || seenValidIds.has(sourceId)) throw new Error(`Duplicate or invalid valid source ID: ${sourceId}`);
    seenValidIds.add(sourceId);
    if (sourceMap[MAPPING_COLUMNS[2]] !== String(seenValidIds.size)) throw new Error(`Valid source order mismatch: ${sourceId}`);
  } else if (sourceId || sourceMap[MAPPING_COLUMNS[2]]) {
    throw new Error(`Invalid row unexpectedly carries valid-source identity: ${sourceRow}`);
  }
  const answers = {};
  for (const name of screening) {
    const sourceValue = row[sourceHeaders[name]];
    if (sourceValue === '') continue;
    if (!yesNo[sourceValue]) throw new Error(`Invalid screening label: ${sourceRow}/${name}`);
    answers[name] = yesNo[sourceValue];
  }
  for (const name of items) {
    const sourceValue = row[name];
    if (sourceValue === '') continue;
    if (!/^[1-5]$/.test(sourceValue)) throw new Error(`Invalid matrix answer: ${sourceRow}/${name}`);
    answers[name] = sourceValue;
  }
  for (const name of demographics) {
    const sourceValue = row[sourceHeaders[name]];
    if (sourceValue === '') continue;
    const normalized = demographicValues[name][sourceValue];
    if (!normalized) throw new Error(`Invalid demographic label: ${sourceRow}/${name}`);
    answers[name] = normalized;
  }
  let screenedOutAt = -1;
  for (const [screeningIndex, name] of screening.entries()) {
    const value = answers[name];
    if (value === undefined || !/^[01]$/.test(value)) throw new Error(`Missing or invalid reachable screening answer: ${sourceRow}/${name}`);
    if (value !== (name === 'S5' ? '0' : '1')) { screenedOutAt = screeningIndex; break; }
  }
  const screenedOut = screenedOutAt >= 0;
  if (isScreening !== screenedOut) throw new Error(`Screening classification mismatch: ${sourceRow}`);
  if (!screenedOut && fields.some((name) => answers[name] === undefined)) throw new Error(`Missing completing response: ${sourceRow}`);
  if (screenedOut) {
    const reachable = screening.slice(0, screenedOutAt + 1);
    if (Object.keys(answers).length !== reachable.length || Object.keys(answers).some((name) => !reachable.includes(name))) {
      throw new Error(`Screened row contains unreachable answers: ${sourceRow}`);
    }
  }
  if (isQualityExcluded && new Set(items.map((name) => answers[name])).size !== 1) throw new Error(`QC row is not straight-lined: ${sourceRow}`);
  if (!isValid) invalidOrdinal++;
  return {
    id: isValid ? sourceId : `SYN-I${String(invalidOrdinal).padStart(3, '0')}`,
    answers,
    sourceStatus: isValid ? 'VALID' : 'INVALID',
    sourceExclusionReason: isValid ? null : classification,
  };
});
if (seenValidIds.size !== 519 || invalidOrdinal !== 120) throw new Error('Source classification counts changed');
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const sourceDigest = sha256(await fs.readFile(source));
const rowDigest = sha256(JSON.stringify(rows));
const artifact = {
  schemaVersion: 5,
  name: path.basename(source),
  synthetic: true,
  label: 'Synthetic rehearsal only — not empirical survey findings or evidence of real respondents\' consent.',
  source: { fileName: path.basename(source), sha256: sourceDigest, ranges: ['MERGED_639_REHEARSAL!A1:BB640', 'Row_Mapping!A1:D640'], join: 'merged Excel row', invalidIdStrategy: 'SYN-I + 3-digit invalid ordinal in merged-row order' },
  reconciliation: { sourceCount: 639, validCount: 519, invalidCount: 120, completingPathCount: rows.filter((row) => screening.every((name) => row.answers[name] === (name === 'S5' ? '0' : '1'))).length, earlyCloseCount: rows.filter((row) => screening.some((name) => row.answers[name] !== undefined && row.answers[name] !== (name === 'S5' ? '0' : '1'))).length, qualityControlInvalidCount: rows.filter((row) => row.sourceExclusionReason === 'QC: straight-line').length, runnableCount: 639, preservedValidIds: seenValidIds.size, generatedInvalidIds: invalidOrdinal },
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
  console.log(JSON.stringify({ rows: rows.length, fields: fields.length, sourceDigest, rowDigest, reconciliation: artifact.reconciliation }));
}

// Explicit read-only schema capture. No browser, no clicks, no formResponse POST.
// Review any change to this pin before allowing workers to use a new form schema.
if (args.includes('--capture-form')) {
  const formId = '1FAIpQLSdTcfJ5fWj2jXUC87OgMLXHDA8eZOB_KoSjmnYRNbUFsixIVg';
  const editFormId = '1SUw44N_WBCEiYR4i4O_p0axXl8R1V-f4he4p-HiT0m8';
  const url = `https://docs.google.com/forms/d/e/${formId}/viewform`;
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
  const pageBreaks = structure.items.filter((item) => item.type === 8).length;
  const answerBlocks = structure.items.filter((item) => [2, 7].includes(item.type));
  const answerSlots = answerBlocks.reduce((count, item) => count + (item.entries?.length ?? 0), 0);
  if (response.url !== url || structure.title !== 'Khảo sát StarCi Academy - Social Media Marketing, Brand Trust & Enrollment Intention' ||
    pageBreaks !== 13 || answerBlocks.length !== 22 || answerSlots !== 53 || !structure.items.some((item) => item.id === 762436152)) {
    throw new Error('Public form structure does not match the corrected fixed-form contract');
  }
  const output = new URL('../apps/api/data/fixed-form-schema.json', import.meta.url);
  await fs.writeFile(output, `${JSON.stringify({ formId, editFormId, resolvedUrl: response.url, observedAt: new Date().toISOString(), observation: 'Public GET only; browser traversal and live submission not verified.', sha256: sha256(JSON.stringify(structure)), structure }, null, 2)}\n`);
  console.log(JSON.stringify({ formStatus: response.status, resolvedUrl: response.url, structureDigest: sha256(JSON.stringify(structure)), pageBreaks, answerBlocks: answerBlocks.length, answerSlots }));
}

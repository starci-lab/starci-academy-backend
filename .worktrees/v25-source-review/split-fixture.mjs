import {readFileSync,writeFileSync} from 'node:fs';
const p=new URL('./.claude/scripts/source-review.spec.mjs',import.meta.url);
let source=readFileSync(p,'utf8').replace("import test from 'node:test';\n",'');
source=source.slice(0,source.lastIndexOf('\ntest('));
writeFileSync(new URL('./.claude/scripts/source-review-fixture.mjs',import.meta.url),source+'\n');
writeFileSync(p,"import test from 'node:test';\nimport { runSourceReviewLifecycle } from './source-review-fixture.mjs';\ntest('accepted source → actual red source-only review → fresh normal repair preserves history and gates consumers', async t => { await runSourceReviewLifecycle(t); });\n");

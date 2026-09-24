import test from 'node:test';
import { runSourceReviewLifecycle } from './source-review-fixture.mjs';
test('accepted source → actual red source-only review → fresh normal repair preserves history and gates consumers', async t => { await runSourceReviewLifecycle(t); });

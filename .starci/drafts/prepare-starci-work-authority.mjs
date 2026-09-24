import fs from 'node:fs';
import { parseYaml } from '../../.claude/core/yaml.mjs';
import {
  approveGoal,
  presentGoal,
  propose,
  requestCell,
  saveRun,
} from '../../.claude/workflows/lifecycle.mjs';

const planDocument = parseYaml(fs.readFileSync(
  new URL('../plans/starci-work-authority-publish-v2/goal/index.yaml', import.meta.url),
  'utf8',
));
const plan = planDocument.plan;
const target = '.work/maintenance/starci-work-authority/index.yaml';
const goal = {
  schema: 'starci/goal@1',
  id: 'prepare-starci-work-authority',
  workflow: 'prepare-work',
  requestId: plan.requestId,
  originalRequest: plan.originalRequest,
  finalOutcome: 'Create one validated maintenance Work leaf that defines validated done Work as downstream authority and inspected code as legacy observation only.',
  scope: {
    business: ['StarCi Work-state execution authority'],
    paths: [],
    resources: [target],
    exclusions: plan.exclusions,
  },
  criteria: ['work-valid'],
  businessChanges: [
    'Create the selected maintenance leaf without changing any Nivo product behavior or .claude source.',
  ],
  impacts: [],
  resourceEffects: [{
    target,
    operation: 'create',
    postcondition: 'A canonical todo maintenance leaf exists and the whole Work workspace validates.',
  }],
  inputs: {
    request: 'Prepare the approved StarCi Work-state authority maintenance scope.',
  },
  cells: [{
    id: 'prepare-work',
    op: 'workspace.manage',
    operation: 'prepare',
    purpose: 'Create and validate the selected maintenance Work leaf only.',
    finalOutput: 'A canonical Work reference for the prepared maintenance leaf.',
    criteria: ['work-valid'],
    inputs: { request: { from: 'request', key: 'request' } },
    outputSchema: {
      type: 'object',
      properties: { workRef: { type: 'string' } },
      required: ['workRef'],
      additionalProperties: false,
    },
  }],
  workTargets: ['nivo.maintenance.starci-work-authority'],
};

process.stderr.write('trace: before propose\n');
let run = propose(goal, {
  workRoot: 'D:\\Repositories\\starci-academy-backend\\.work',
  repositories: {},
});
process.stderr.write('trace: after propose\n');
run = presentGoal(run, {
  messageId: 'msg_0a5aed68754fb053016aa01b0e342487d0a870e8303b503d9b',
  scope: plan,
  jobId: 'prepare-starci-work-authority',
});
process.stderr.write('trace: after presentGoal\n');
run = approveGoal(run, {
  actor: 'user',
  phase: 'goal',
  digest: run.goalDigest,
  approved: true,
  messageId: '01a0816a-2d62-7b13-b812-c481165371dc',
  quote: 'duyệt v2',
  replyTo: 'msg_0a5aed68754fb053016aa01b0e342487d0a870e8303b503d9b',
});
process.stderr.write('trace: after approveGoal\n');
const issued = requestCell(run, 'prepare-work');
process.stderr.write('trace: after requestCell\n');
saveRun(issued.run, plan.id);
process.stderr.write('trace: after saveRun\n');
process.stdout.write(`${JSON.stringify({
  goalDigest: issued.run.goalDigest,
  scopeDigest: issued.run.scopeDigest,
  request: issued.request,
}, null, 2)}\n`);

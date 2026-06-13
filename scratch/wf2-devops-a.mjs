export const meta = {
  name: 'flashcards2-devops-a',
  description: 'Write 2 new DevOps flashcard decks into .gitrefs/data: ci-cd-and-pipelines, kubernetes-and-orchestration',
  phases: [{ title: 'Write decks' }],
}

const SPEC = `You are writing an interview-prep flashcard deck for StarCi Academy DevOps Mastery. Output is markdown files seeded into a DB. Match this EXACT format and depth. Do NOT read-then-overwrite, modify, or delete any existing file outside your target deck folder.

IMPORTANT: write files under .gitrefs/data (the real content git source), NOT .mount (which is a detachable cache).

FILE FORMAT (every separator is the literal line  <!-- @starci/seperator -->  alone on its own line)

Deck meta en.md:
# title
<!-- @starci/seperator -->
THE TITLE
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
one to two sentence description
<!-- @starci/seperator -->
# difficulty
<!-- @starci/seperator -->
medium
<!-- @starci/seperator -->
# moduleRefs
## 0
<!-- @starci/seperator -->
module-display-id-one
<!-- @starci/seperator -->

Deck meta vi.md: identical structure, Vietnamese title and description, SAME difficulty and SAME moduleRefs.

Card en.md (one folder per card: cards/0-card/en.md ... cards/7-card/en.md):
# question
<!-- @starci/seperator -->
the scenario-driven interview question
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
one of: junior | middle | senior | staff
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Tag1
## 1
<!-- @starci/seperator -->
Tag2
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — three to six substantial sentences
:::

:::muted
**Trade-off** — three to six substantial sentences
:::

:::muted
**Pitfall & Failure mode** — three to six substantial sentences
:::
<!-- @starci/seperator -->

Card vi.md: identical structure; question and answer in Vietnamese WITH full diacritics; level and tags IDENTICAL to en.md (keep the English tag strings); the three bold labels in vi.md are exactly: **Giải pháp**, **Trade-off**, **Cạm bẫy & Failure-mode**.

QUALITY BAR: questions must be concrete and scenario-driven (a symptom, a trade-off, a design choice) — never a bare "What is X?". Each of the three answer blocks must be genuinely substantial and technically correct. Vietnamese must be natural and fully accented; do not force-translate technical terms (keep pipeline, artifact, Pod, probe, rollout, etc.).`

function buildPrompt(deck) {
  return `${SPEC}

## TARGET
Create NEW deck folder (relative to repo root): ${deck.path}
- Deck title (en): "${deck.titleEn}"
- Deck title (vi): "${deck.titleVi}"
- difficulty: medium
- moduleRefs (use these exact displayIds, in this order): ${deck.refs.join(', ')}
Write the deck meta en.md and vi.md, then 8 cards in cards/0-card ... cards/7-card (each en.md + vi.md).

## THE 8 TOPICS (one card each; vary level across junior/middle/senior/staff, roughly 1 junior, 2-3 middle, 3-4 senior, 1 staff)
${deck.topics}

## VALIDATE BEFORE FINISHING (run this bash and fix anything reported)
bash -c 'd="${deck.path}"; for f in "$d"/cards/*/en.md "$d"/cards/*/vi.md; do n=$(grep -cE "^# (question|level|tags|answer)$" "$f"); [ "$n" -ne 4 ] && echo "BAD $f ($n/4)"; done; echo "files: $(find "$d" -type f | wc -l) (expect 18)"'
Fix any BAD file or a count != 18. Report final file count and level distribution.`
}

const decks = [
  {
    label: 'devops6-cicd',
    path: '.gitrefs/data/courses/2-devops-mastery/flashcard-decks/6-ci-cd-and-pipelines',
    titleEn: 'CI/CD & Pipelines',
    titleVi: 'CI/CD & Pipeline',
    refs: ['terraform-fundamentals'],
    topics: `0. CI vs continuous delivery vs continuous deployment — what each automates and where a human approval gate belongs. (junior)
1. Pipeline stage ordering — lint, test, build, scan, deploy — and why fast feedback first matters. (middle)
2. Build once, promote the same immutable artifact across dev/staging/prod instead of rebuilding per env. (middle)
3. Secrets in CI — OIDC federation to the cloud instead of long-lived static keys, and masked variables. (senior)
4. Keeping pipelines fast — caching, parallelism, and quarantining flaky tests. (middle)
5. Deploy gates in the pipeline — blue/green and canary with automated rollback on bad metrics. (senior)
6. GitOps — declarative desired state in git and pull-based reconciliation (Argo CD / Flux) vs push deploys. (senior)
7. Designing a pipeline for many services shipping daily — monorepo vs poly-repo, trunk-based dev, preview environments. (staff)`,
  },
  {
    label: 'devops7-k8s',
    path: '.gitrefs/data/courses/2-devops-mastery/flashcard-decks/7-kubernetes-and-orchestration',
    titleEn: 'Kubernetes & Orchestration',
    titleVi: 'Kubernetes & Orchestration',
    refs: ['terraform-fundamentals'],
    topics: `0. Pod vs Deployment vs Service vs Ingress — how an external request actually reaches a container. (junior)
1. Liveness vs readiness probes — what each controls, and how a misconfigured probe causes an outage. (middle)
2. Requests vs limits — how they drive scheduling, OOMKills, and CPU throttling. (senior)
3. Rolling updates and rollback — maxSurge / maxUnavailable and what a stuck rollout looks like. (middle)
4. ConfigMaps and Secrets — 12-factor config injection and the secret-at-rest caveat. (middle)
5. Autoscaling — HPA vs the cluster autoscaler, and why scaling lags a traffic spike. (senior)
6. Networking — ClusterIP/NodePort/LoadBalancer, Ingress, and NetworkPolicy for isolation. (senior)
7. Designing a production cluster — namespaces, RBAC, resource quotas, multi-tenancy, and upgrades. (staff)`,
  },
]

phase('Write decks')
const results = await parallel(decks.map((d) => () => agent(buildPrompt(d), { label: d.label, phase: 'Write decks' })))
return results

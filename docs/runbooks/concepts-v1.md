# Concepts V1 reader

Publish `concepts/` in the existing data repository first. The backend init downloads
that repository into its usual retained Git snapshot, seeds PostgreSQL, and the
frontend reads the `concepts` and `concept` GraphQL queries. The frontend routes are
`/{lang}/concept` and `/{lang}/concept/{displayId}` (`en` or `vi`).

## Initial rollout

1. Pull the backend change and apply the pending primary migrations using the
   deployment's normal migration step (`npm run migrate:primary`, with its target
   database environment configured). `CreateConcepts1788400000000` adds four tables
   independently of courses: `concepts`, `concept_translations`, `concept_sections`,
   and `concept_section_translations`.
2. Start the backend with init enabled. For a targeted first seed, use the mounted
   init `seed.yaml` configuration below. This also handles a data SHA that the old
   backend already recorded: ordinary diff mode skips an unchanged SHA.
3. Point the frontend's `NEXT_PUBLIC_API_GRAPHQL_BASE_URL` at that backend and open
   `/vi/concept`. After this first seed, normal diff mode picks up `concepts/` edits.

```yaml
enable: true
seed:
  enabled: true
  concepts: true
sync:
  enabled: false
```

This targeted configuration does not seed course tracks or rebuild search indexes.
Keep the filesystem context and retained snapshot available: the Source tab reads
the authored workspace files from the successfully seeded snapshot manifest.

## Authoring another concept later

```text
concepts/
  0-request-response-lifecycle/
    en.md
    vi.md
    sections/
      0-interview/
        en.md
        vi.md
    workspace/
      source.ts
      source.test.ts
```

Use the seven existing anchors as the schema examples. V1 keeps the legacy marker
`<!-- @starci/seperator -->`; nested headings inside a body must remain between
the marker pair. Root fields and sections are separate database rows. Activities
stay as localized JSON fields, with grading metadata excluded from public reads.
Keep structural identifiers consistent across EN/VI; numeric folder prefixes order
the material while the slug supplies its stable identity. The scoped attributes
file pins Markdown and workspace files to LF for portable source checksums.

This release renders authored lessons, diagrams, code, and practice prompts. It
does not grade answers, execute simulations, or persist learner progress. Existing
courses remain available. Missing or empty concept mounts cannot delete the domain;
a complete nonempty snapshot synchronizes it in one transaction.

# Contracts · Expert academy control center

## Entity · Academy growth snapshot (`entity-1`)

Fields: `revenue`, `paid orders`, `students`, `completions`, `active rate`

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## Entity · Academy student (`entity-2`)

Fields: `memberId`, `name`, `email`, `status`, `course progress`

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## Entity · Expert site lead (`entity-3`)

Fields: `leadId`, `contact`, `status`, `note`

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## Entity · Academy integrations (`entity-4`)

Fields: `domain`, `Google OAuth`, `SMTP`, `payments`, `Zalo`, `analytics`, `webhooks`

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## Operation · myAcademyGrowthSnapshot

- Kind/owner: `query` / `backend`
- Inputs: siteId
- Outputs: academy growth snapshot
- Failures: not owned or unavailable
- Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## Operation · myAcademyStudents

- Kind/owner: `query` / `backend`
- Inputs: siteId, paging and filters
- Outputs: student page
- Failures: not owned or unavailable
- Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## Operation · createAcademyStudent

- Kind/owner: `mutation` / `backend`
- Inputs: siteId, name, email, optional password and role
- Outputs: created student
- Failures: validation or ownership refusal
- Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## Operation · grantAcademyCourseAccess

- Kind/owner: `mutation` / `backend`
- Inputs: siteId, email, courseSlug
- Outputs: gifted course access
- Failures: course, student or ownership refusal
- Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

No field, failure or operation may appear here without routed source evidence.

# Contracts · Projects and career

## Entity · Personal project (`personal-project`)

Fields: `course`, `milestones`, `tasks`, `completion percentage`, `GitHub URL`

Evidence: `EV-001`, `EV-004`, `EV-007`

## Entity · Headhunting company (`headhunting-company`)

Fields: `company id`, `label`, `metadata`, `availability`

Evidence: `EV-005`, `EV-006`, `EV-008`

## Entity · Consultant (`consultant`)

Fields: `consultant id`, `label`, `metadata`, `contact availability`

Evidence: `EV-005`

## Operation · submitPersonalGithubUrl

- Kind/owner: `mutation` / `backend`
- Inputs: course id, GitHub URL
- Outputs: updated enrollment
- Failures: authentication rejected, enrollment missing, URL rejected
- Evidence: `EV-007`

## Operation · headhuntingCompanies

- Kind/owner: `query` / `backend`
- Inputs: none
- Outputs: headhunting companies
- Failures: query failed
- Evidence: `EV-008`

No field, failure or operation may appear here without routed source evidence.

# Contracts · Projects and career

## Entity · Personal project (`personal-project`)

Fields: `course`, `milestones`, `tasks`, `completion percentage`, `current task`, `repository connection`

Evidence: `EV-001`, `EV-004`, `EV-007`

## Entity · Personal project review intent (`personal-project-review-intent`)

Fields: `course id`, `task id`, `GitHub URL`, `branch`, `language`, `selected model`, `selected provider`

Evidence: `EV-011`, `EV-012`, `EV-014`

## Entity · Personal project attempt (`personal-project-attempt`)

Fields: `attempt number`, `score`, `verdict`, `short feedback`, `served model`, `served provider`, `processed time`, `structured findings`

Evidence: `EV-013`, `EV-016`

## Entity · Personal project repository settings (`personal-project-repository-settings`)

Fields: `GitHub URL`, `branch`, `token last four`

Evidence: `EV-015`

## Entity · Headhunting company (`headhunting-company`)

Fields: `company id`, `label`, `metadata`, `availability`

Evidence: `EV-005`, `EV-006`, `EV-008`

## Entity · Consultant (`consultant`)

Fields: `consultant id`, `label`, `metadata`, `contact availability`

Evidence: `EV-005`

## Operation · myCourseOutline

- Kind/owner: `query` / `backend`
- Inputs: course id
- Outputs: milestones, progress, current task
- Failures: authentication rejected, enrollment missing, query failed
- Evidence: `EV-004`

## Operation · personalProjectTaskWorkspace

- Kind/owner: `aggregate` / `frontend`
- Inputs: course id, task id
- Outputs: authored task, repository settings, gradable model catalog
- Failures: task denied, task unavailable, ancillary repository unavailable, model catalog unavailable
- Evidence: `EV-009`, `EV-011`, `EV-015`

## Operation · syncPersonalProjectGithub

- Kind/owner: `mutation` / `backend`
- Inputs: course id, GitHub URL, branch, private token patch
- Outputs: acknowledgement and token last four on refetch
- Failures: authentication rejected, enrollment missing, URL or branch rejected, token rejected
- Evidence: `EV-015`

## Operation · reviewPersonalProjectTask

- Kind/owner: `mutation` / `backend`
- Inputs: course id, task id, GitHub URL, branch, language, selected model, selected provider
- Outputs: review job id
- Failures: authentication rejected, enrollment missing, repository missing or invalid, branch invalid, model unavailable or unentitled, enqueue failed
- Evidence: `EV-012`, `EV-014`, `EV-016`

## Operation · userPersonalTaskAttempts

- Kind/owner: `query` / `backend`
- Inputs: course id, task id, newest-first page
- Outputs: immutable attempt page
- Failures: access denied, query failed
- Evidence: `EV-013`

## Operation · userPersonalTaskAttemptFeedbacks

- Kind/owner: `query` / `backend`
- Inputs: attempt id, authored-order page
- Outputs: structured findings
- Failures: access denied, query failed
- Evidence: `EV-013`

## Operation · headhuntingCompanies

- Kind/owner: `query` / `backend`
- Inputs: none
- Outputs: headhunting companies
- Failures: query failed
- Evidence: `EV-008`

No field, failure or operation may appear here without routed evidence.

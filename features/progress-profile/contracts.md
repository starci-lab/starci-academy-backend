# Contracts · Progress, profile and league

## Entity · Learner profile (`learner-profile`)

Fields: `display name`, `bio`, `avatar`, `role title`, `location`, `visibility`, `work preferences`, `links`, `branding`

Evidence: `EV-003`, `EV-004`, `EV-007`

## Entity · Dashboard progress (`dashboard-progress`)

Fields: `courses`, `daily quest`, `streak`, `weekly goals`, `job readiness`, `weekly challenge`, `contributions`

Evidence: `EV-002`

## Entity · League standing (`league-standing`)

Fields: `scope`, `tier`, `rank`, `cohort`, `points`, `podium`

Evidence: `EV-005`, `EV-006`, `EV-009`

## Operation · updateProfile

- Kind/owner: `mutation` / `backend`
- Inputs: partial identity, preference and branding patch
- Outputs: refreshed user
- Failures: authentication rejected, field validation rejected, persistence failed
- Evidence: `EV-007`

## Operation · claimDailyQuestReward

- Kind/owner: `mutation` / `backend`
- Inputs: none
- Outputs: granted points and completion
- Failures: authentication rejected, quest incomplete, already claimed today
- Evidence: `EV-008`

## Operation · myLeague

- Kind/owner: `query` / `backend`
- Inputs: none
- Outputs: weekly tier and ranked cohort
- Failures: authentication rejected, league unavailable
- Evidence: `EV-009`

No field, failure or operation may appear here without routed source evidence.

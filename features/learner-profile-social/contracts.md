# Contracts · Hồ sơ học viên và bằng chứng công khai

## Entity · Hồ sơ công khai (`public-profile`)

Fields: `id`, `username`, `displayName`, `bio`, `avatar`, `githubUsername`, `followerCount`, `followingCount`, `isFollowedByMe`, `profileLocked`, `openToWork`, `roleTitle`, `location`, `workMode`, `links`

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`

## Entity · Bằng chứng hồ sơ (`profile-evidence`)

Fields: `skills`, `coding history`, `challenges`, `projects`, `CV`, `activity`, `wrapped`

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`

## Entity · Quan hệ theo dõi (`follow-edge`)

Fields: `followerId`, `followingId`

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`

## Operation · userProfile

- Kind/owner: `query` / `backend`
- Inputs: username
- Outputs: public profile and follow state
- Failures: User not found, Profile locked
- Evidence: `EV-002`, `EV-003`, `EV-004`

## Operation · setFollow

- Kind/owner: `mutation` / `backend`
- Inputs: target user, follow boolean, authenticated viewer
- Outputs: success envelope
- Failures: Target missing/deleted
- Evidence: `EV-002`, `EV-003`, `EV-004`

No field, failure or operation may appear here without routed source evidence.

# Flow · Seed demo-owned apps

> ID: `seeded-owned-apps-journey` · Trigger: The Nivo backend completes application bootstrap

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `demo-owner` | `owned-apps-feed` | The backend resolves the fixed demo account | Seeding skips safely when the account does not exist |
| 2 | `demo-owner` | `owned-apps-feed` | The backend upserts the two declared owned instances | Exactly one Expert Academy row and one MMO row are owned by the demo account |
| 3 | `demo-owner` | `owned-apps-feed` | The authenticated demo owner requests myInstances | Both seeded app identities are returned through the generic instance projection |

## Outcomes

- The frontend can render Học viện Chuyên gia and MMO as two current owned apps without provisioning MMO infrastructure

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`

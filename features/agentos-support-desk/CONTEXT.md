# Context

- Project: nivo
- Feature: agentos-support-desk
- Authority status: in-progress
- Business head: 73e332430f69f4f2ec8029e68540ce9d012ffa5350ab354e9e3327ab64ebc51f
- Depends on AgentOS Module Studio: 01e0eec6f0da753e9526d8260812fdb0aeb3aa760c277cf5d157717f5a9a4cb7
- Frontend baseline: 6eef6117b1d0506d1a8b4299fa225d5d22a1e73d
- Backend baseline: b8560546e7acdcffec09b74f6823c10964b1fa9d

This feature specializes the shared Module Studio authority for one Support Desk installation. Each candidate revision has one distinct private resumable Setup session, while Setup messages only update the candidate draft and Apply alone creates the next immutable context version. Every accepted live customer turn is durably visible and follows a policy-safe automatic response, approval, handoff, fallback or explicit failed-delivery path; mutable channel handles remain display metadata rather than durable identity.

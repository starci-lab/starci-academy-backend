# Actors · AgentOS AI and knowledge provisioning

## Authenticated owner of one exact AgentOS workspace (`workspace-owner`)

Can:

- Observe AI provisioning and knowledge readiness without receiving infrastructure credentials
- Inspect the pinned provider and chat model, knowledge origins, artifact versions and safe failure status
- Upload module documents and observe their scan, extraction and indexing progression
- Run or retry one bounded AI readiness test for the exact workspace
- Request an existing workspace knowledge reindex without accessing raw documents or Qdrant administration

Evidence: `EV-001`, `EV-002`, `EV-012`, `EV-013`

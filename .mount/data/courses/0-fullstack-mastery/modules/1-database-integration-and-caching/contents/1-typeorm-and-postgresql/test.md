# Test Flows — 1-typeorm-and-postgresql

Status: AUTHORED (4 flows). E2E verification pending sandbox unblock.

## Flow 1 — Create cat with cascade relations (`POST /cats`)

- Request body:

```json
{"name":"Milo","passport":{"passportNumber":"PP-001"},"toys":[{"name":"Ball"}],"owners":[{"name":"Alice"}]}
```

- Expected (HTTP 201): cat with `id`, nested `passport`, `toys[]`, `owners[]` all assigned IDs by TypeORM cascade.

## Flow 2 — Read object graph (`GET /cats` + `GET /cats/:id`)

- `GET /cats` returns `[ { id, name, passport, toys, owners } ]` with relations populated via `find({ relations: [...] })`.
- `GET /cats/1` returns the same single object.
- `GET /cats/999` returns HTTP 404.

## Flow 3 — Explicit relation loading (`GET /cats/:id/with-relations`)

- Request: `GET /cats/1/with-relations`
- Expected (HTTP 200): cat with `passport`, `toys`, `owners` fully hydrated.
- Validation: identical shape to Flow 2 but reached via a dedicated endpoint documenting explicit eager loading.

## Flow 4 — Mutate 1:N collection (`POST /cats/:id/toys`)

- Request: `POST /cats/1/toys` body `{"name":"Laser Pointer"}`
- Expected (HTTP 201): cat with `toys` array containing both the original toy and the newly inserted toy.
- Validation: `toys.length` increases by 1; new toy has fresh auto-incremented `id`.

# title
Refresh Token Strategy

# description
Hands-on building a refresh token flow to extend access tokens without requiring users to re-login, maintaining seamless UX and security.

# body

## 1. Opening

"Access token expires after 15 minutes — users have to re-login constantly, how do we fix this?" — a **Senior Engineer** asks during UX review. A **Mid-level Developer** answers: "I'll increase expiry to 7 days." The answer shows awareness of UX, but misses depth on **security**: a long-lived token gets stolen → attacker accesses all resources for 7 days. **Refresh token** allows short-lived access tokens (15m) paired with long-lived refresh tokens (7d) — when access token expires, clients use the refresh token to get a new access token without re-entering credentials.

This lesson runs through two tracks:
- **Part 2.1**: **hands-on**; **stack** is **NestJS** + **PostgreSQL** (Docker), with **two flows** (signin → tokens; refresh → new tokens).
- **Part 2.2**: **theory** clarifying **token rotation**, **refresh flow**, and **edge cases**.

## 2. Core concepts

The lesson structure follows **practice-led theory**. First, learners clone the source, start **PostgreSQL** via **Docker Compose**, run **NestJS** via `nest start --watch`, and call APIs to observe the refresh token flow end-to-end. Then the **theory** section analyzes token rotation and **edge cases**.

### 2.1. Hands-on

#### 2.1.1. Prepare source code and environment

Source: [StarCi-Academy/fullstack-mastery-module-4-authentication-authorization-jwt-rbac](https://github.com/StarCi-Academy/fullstack-mastery-module-4-authentication-authorization-jwt-rbac) on GitHub — lesson directory: [`1-refresh-token-strategy`](https://github.com/StarCi-Academy/fullstack-mastery-module-4-authentication-authorization-jwt-rbac/tree/main/1-refresh-token-strategy).

```bash
git clone https://github.com/StarCi-Academy/fullstack-mastery-module-4-authentication-authorization-jwt-rbac.git
cd fullstack-mastery-module-4-authentication-authorization-jwt-rbac/1-refresh-token-strategy
```

#### 2.1.2. Architecture / components

| Component | File | Role |
| --- | --- | --- |
| **PostgreSQL** | `.docker/compose.yaml` | Stores users |
| **AuthController** | `src/modules/auth/auth.controller.ts` | signup, signin, refresh |
| **AuthService** | `src/modules/auth/auth.service.ts` | Issues access + refresh tokens |
| **RefreshDto** | `src/modules/auth/dto/refresh.dto.ts` | Validates refresh payload |

#### 2.1.3. Prerequisites and startup

##### 2.1.3.1. Prerequisites

- **Node.js** LTS, **npm**, **NestJS CLI**, **Docker Desktop**.
- **Windows:** API commands use **`Invoke-RestMethod`** (PowerShell). See parallel **`curl`** for macOS / Linux.

##### 2.1.3.2. Start

```bash
# Step 1: Start infrastructure
docker compose -f .docker/compose.yaml up -d

# Step 2: Install dependencies
npm install

# Step 3: Start in watch mode
nest start --watch
```

#### 2.1.4. Verification

##### 2.1.4.1. Flow 1 — Signin and receive token pair

  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri http://localhost:3000/auth/signup -Method Post -ContentType "application/json" -Body '{"email":"test@demo.com","password":"secret123"}'
  $res = Invoke-RestMethod -Uri http://localhost:3000/auth/signin -Method Post -ContentType "application/json" -Body '{"email":"test@demo.com","password":"secret123"}'
  $res

  # macOS / Linux
  curl -s -X POST http://localhost:3000/auth/signup -H "Content-Type: application/json" -d '{"email":"test@demo.com","password":"secret123"}'
  curl -s -X POST http://localhost:3000/auth/signin -H "Content-Type: application/json" -d '{"email":"test@demo.com","password":"secret123"}'
  ```

  Response (HTTP 200): `{ "access_token": "<JWT>", "refresh_token": "<JWT>" }`.

##### 2.1.4.2. Flow 2 — Use refresh token to renew

  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri http://localhost:3000/auth/refresh -Method Post -ContentType "application/json" -Body "{`"refresh_token`":`"$($res.refresh_token)`"}"

  # macOS / Linux
  curl -s -X POST http://localhost:3000/auth/refresh -H "Content-Type: application/json" -d '{"refresh_token":"<refresh_token>"}'
  ```

  Response (HTTP 200): new token pair `{ "access_token": "<new>", "refresh_token": "<new>" }`.

*If the responses match:*

- *Token rotation — each refresh returns a new pair, old refresh token is invalidated.*
- *Short-lived access token — reduces attack window if token is stolen.*

#### 2.1.5. Cleanup

When you are done, tear down to free resources.

```bash
# Step 1: Stop the running server
# Windows / macOS / Linux
Ctrl + C

# Step 2: Close Docker (if the lesson uses Docker)
docker compose -f .docker/compose.yaml down -v
```

#### 2.1.6. Further reading

- **OAuth 2.0 Refresh Tokens:** RFC 6749 standard. ([RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749#section-1.5))
- **NestJS Authentication:** JWT + refresh strategy. ([NestJS Docs](https://docs.nestjs.com/security/authentication))

### 2.2. Theory — Refresh Token Flow

#### 2.2.1. Access Token vs Refresh Token

| Access Token | Refresh Token |
| --- | --- |
| Short-lived (15m) | Long-lived (7d) |
| Sent with every request (Bearer) | Only sent when renewing |
| If stolen → limited damage | If stolen → must revoke immediately |

#### 2.2.2. Edge cases to internalize

- **Refresh token reuse:** Attacker uses old refresh token. **Fix:** token rotation — invalidate old when issuing new.
- **Concurrent refresh:** Multiple tabs send refresh simultaneously. **Fix:** grace period or token family tracking.
- **Refresh token not stored in DB:** Cannot revoke. **Fix:** store hash in DB, check before issuing.
- **Missing HTTPS:** Tokens intercepted in transit. **Fix:** enforce HTTPS everywhere.

## 3. Wrap-up

### 3.1. Common interview questions

- **Question 1:** Why use refresh tokens instead of increasing access token expiry?
  - Sample answer: Short-lived access tokens limit damage when stolen; refresh tokens are used separately for renewal.

- **Question 2:** What is token rotation?
  - Sample answer: Each refresh issues both new access and refresh tokens; old tokens are invalidated.

- **Question 3:** Where to store refresh tokens most securely?
  - Sample answer: HttpOnly cookie (XSS protection) + secure flag (MITM protection).

# references
## 0
### alias
NestJS Authentication
### url
https://docs.nestjs.com/security/authentication
## 1
### alias
RFC 6749 - OAuth 2.0
### url
https://datatracker.ietf.org/doc/html/rfc6749

# minutesRead
15

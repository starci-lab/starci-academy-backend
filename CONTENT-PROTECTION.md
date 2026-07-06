# Content protection — anti-scrape, watermark, takedown playbook

> What's built + how to operate it. Honest scope: you **cannot** fully prevent copying of text that renders in a
> browser (DevTools/network/screenshot). The strategy is **server-side gating + raise the cost of bulk harvest +
> make leaks traceable + shift the real value to un-copyable proof-services**. Mirrors how O'Reilly/educative
> handle text (they don't DRM text — they gate, watermark, rate-limit, and lean on the interactive/graded moat).

## Layers in place

### 1. Server-side gating (primary defense — already existed)
`content.handler.ts` truncates premium lesson bodies at the "Kiểm thử / Verification / Testing" heading and strips
`codeExplainings`/`codeImplementations` for **non-entitled** viewers. The valuable part never leaves the server for
a trial/unpurchased user. **Do NOT reverse-trial content** (never send the full premium body then revoke) — that
reintroduces exactly the leak this prevents.

### 2. Per-user content rate limit (NEW — `content.handler.ts` `enforceContentAccessRate`)
- Atomic Redis fixed-window counter per **user** (`content:access-rate:{userId}`, `INCR` + first-hit `EXPIRE`).
- Limit: **`CONTENT_ACCESS_LIMIT = 200` reads / `CONTENT_ACCESS_WINDOW_SECONDS = 3600` (1h)** per user.
  Generous for a human reader; the existing per-IP throttler (`@UseThrottler(Soft)` = 100/min) already caps bursts.
  This catches **sustained bulk harvest across IP/session rotation** (which IP-throttling misses).
- On breach → throws `ContentScrapeRateLimitException` ("Too many content requests…") → blocks reads until the
  window rolls over. Self-healing (no permanent lockout of a false-positive).
- **Tuning:** lower `CONTENT_ACCESS_LIMIT` to tighten; raise if legit power-users trip it. Both consts top of
  `content.handler.ts`.

### 3. Scraper evidence log (NEW — Loki)
- First time a user crosses the limit → `WinstonLog.ContentScrapeDetected` (level `warn`, Loki + console) with
  **`userId`, `email`, `count`, `limit`, `windowSeconds`**. Logged once per window (no spam).
- This is your **offender list** → review + decide on a manual ban.

### 4. Per-user watermark (NEW — FE `blocks/security/ContentWatermark`)
- Faint tiled **viewer email** overlaid on the FULL lesson body (`LessonReader`, `!isLocked`). `pointer-events-none`
  (never blocks legit reading/selection), `aria-hidden`, ~6% opacity, diagonal.
- Purpose = **traceability**: any screenshot/photo of premium content carries the leaker's email → takedown/ban
  evidence + a strong deterrent (students know a leak points back to them).
- Not on the locked teaser (that's public marketing). No download/print path exists, so on-screen is the vector.

## Takedown / ban playbook (the "DMCA" half — a process, not code)
1. **Detect:** watch Loki for `ContentScrapeDetected` (alert on it). Or a leaked copy surfaces in the wild.
2. **Trace:** the leaked screenshot carries the **watermark email** → the account. The scrape log independently
   names the `userId`+`email`.
3. **Ban:** disable the account in **Keycloak** (identity is external; the app has no `isScrapeBlocked` column yet —
   see "next step"). This is a **human decision** on the flagged user (avoids auto-locking a false-positive
   power-user).
4. **DMCA takedown:** for content reposted on GitHub/torrent/cyberlocker/YouTube → file a DMCA notice; the
   watermark email is the ownership+source evidence. (Big platforms use anti-piracy vendors to automate this at
   scale — an option later.)

## If you add VIDEO later
Text has no meaningful DRM; **video does**. Use a DRM video provider (Mux / Cloudflare Stream / Vimeo OTT) with
Widevine/FairPlay + short-lived signed URLs + forensic watermark. **Never self-host mp4.**

## The real moat (strategic — why a partial leak is survivable)
Even a perfect content leak doesn't reproduce StarCi's value: the **graded proof** (capstone review, mock-interview
scoring, job-readiness, recruiter profile) is a per-user **server-side service** — not a file. Lean the paid pitch
on that (see `features/learn/TRIAL-CONVERSION-LAYOUT-BRAINSTORM.md`): the copyable part is the cheap part; the
valuable part can't be copied.

## Next step (deferred — needs a decision)
Persistent auto-ban: add `user.isScrapeBlocked` (migration) + enforce in the auth guard + an admin unban path. Left
out on purpose — the per-window block + manual Keycloak disable is safer against false positives for now.

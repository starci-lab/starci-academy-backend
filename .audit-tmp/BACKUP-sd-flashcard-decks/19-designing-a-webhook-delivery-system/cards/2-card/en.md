# question
<!-- @starci/seperator -->
Because your system is at-least-once, subscribers will occasionally receive the same webhook twice, and they also need to be sure a request really came from you and was not forged. How do you design delivery ids and request signing so consumers can both dedupe and verify authenticity?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
middle
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Idempotency
## 1
<!-- @starci/seperator -->
HMAC
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — Stamp every delivery with a stable, unique id (for example an `X-Webhook-Id` header) that stays the same across all retry attempts of that delivery, so the consumer can store seen ids and treat a repeat as a no-op. For authenticity, compute an HMAC signature over the raw request body (plus a timestamp) using a per-subscriber shared secret, and send it in a header like `X-Webhook-Signature`. The consumer recomputes the HMAC with their copy of the secret and compares using a constant-time equality check; a match proves the payload was produced by someone holding the secret and was not modified in transit. Include the timestamp inside the signed material and reject deliveries whose timestamp is too old to blunt replay attacks.
:::

:::muted
**Trade-off** — Symmetric HMAC is simple, fast, and easy for consumers to implement, but the shared secret lives on both sides, so any subscriber compromise means rotating that secret and a leak lets an attacker forge events. Asymmetric signatures (the platform signs with a private key, consumers verify with a public key) remove the shared-secret problem and are better for many untrusted consumers, at the cost of more complex key distribution and rotation. Signing the raw bytes is essential but constrains you: consumers must verify before any JSON re-serialization, because re-encoding can change bytes and break the signature.
:::

:::muted
**Pitfall & Failure mode** — The most common verification bug is signing or comparing the parsed/re-serialized body instead of the exact received bytes, which produces signatures that mysteriously fail for some payloads. Using a non-constant-time string comparison leaks timing information that can help an attacker forge a signature. On the dedupe side, a too-short id-retention window lets a late retry slip through as a "new" event, and treating a duplicate as an error rather than a silent no-op breaks legitimate at-least-once retries — dedupe should be idempotent, not rejecting.
:::
<!-- @starci/seperator -->

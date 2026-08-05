/**
 * Lifecycle status of a single API key inside the AI Balancer pool.
 *
 * - `Active`   -- healthy, eligible for rotation.
 * - `Disabled` -- too many consecutive failures; periodic health check may revive.
 * - `Probing`  -- probationary slot used during recovery; not eligible for normal rotation.
 */
export enum KeyStatus {
    /** Healthy -- eligible for normal rotation. */
    Active = "active",
    /** Too many consecutive failures -> hard-skip until a health check revives it. */
    Disabled = "disabled",
    /** Probation after recovery -- not in normal rotation so a flapping key cannot take live traffic. */
    Probing = "probing",
}

/**
 * Lifecycle status of a single API key inside the AI Balancer pool.
 *
 * - `Active`   — healthy, eligible for rotation.
 * - `Disabled` — too many consecutive failures; periodic health check may revive.
 * - `Probing`  — probationary slot used during recovery; not eligible for normal rotation.
 */
export enum KeyStatus {
    Active = "active",
    Disabled = "disabled",
    Probing = "probing",
}

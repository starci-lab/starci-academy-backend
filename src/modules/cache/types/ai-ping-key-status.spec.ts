import {
    isPingEntryEligible,
} from "./ai-ping-key-status"

describe("isPingEntryEligible", () => {
    const now = new Date("2026-06-22T10:00:00.000Z")

    it("treats an unknown (undefined) key as eligible", () => {
        expect(isPingEntryEligible(undefined, now)).toBe(true)
    })

    it("excludes a hard-disabled key", () => {
        expect(isPingEntryEligible({
            status: false,
            lastPing: now.toISOString(),
            disabled: true,
        }, now)).toBe(false)
    })

    it("excludes a key still within its cooldown window", () => {
        expect(isPingEntryEligible({
            status: false,
            lastPing: now.toISOString(),
            cooldownUntil: new Date(now.getTime() + 30_000).toISOString(),
        }, now)).toBe(false)
    })

    it("re-admits a key once its cooldown has passed (self-heal)", () => {
        expect(isPingEntryEligible({
            status: false,
            lastPing: now.toISOString(),
            cooldownUntil: new Date(now.getTime() - 1_000).toISOString(),
        }, now)).toBe(true)
    })

    it("treats a healthy entry with no cooldown as eligible", () => {
        expect(isPingEntryEligible({
            status: true,
            lastPing: now.toISOString(),
        }, now)).toBe(true)
    })
})

/**
 * Standalone-domain seed/sync toggles, plus the global flashcard pass.
 *
 * Decouples the per-course tracks from the on/off domains so every builder
 * (full / custom / diff) can hand the overlay assembler the exact domain set it
 * resolved instead of a fixed flashcard+foundations pair.
 */
export interface DomainFlags {
    /** Run the global flashcard-deck pass (seed + ES sync). */
    flashcard: boolean
    /** Seed + sync the standalone foundations domain. */
    foundations: boolean
    /** Seed + sync CV templates. */
    cv: boolean
    /** Seed + sync headhunting companies/consultants. */
    headhunting: boolean
    /** Seed the AI model catalog (seed-only — no sync sink). */
    aiModels: boolean
    /** Seed the subscription catalog (seed-only — no sync sink). */
    subscriptions: boolean
    /** Seed + sync coding-practice problems. */
    codingProblems: boolean
}

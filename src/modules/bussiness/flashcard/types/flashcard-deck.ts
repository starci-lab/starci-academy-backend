/**
 * One raw row of per-deck, per-user review aggregates from the deck-list stats
 * query. Postgres returns the `COUNT(*)` aggregates as strings.
 */
export interface DeckStatRow {
    /** The deck id (raw `deck_id` alias). */
    deck_id: string
    /** Cards in the deck currently due for the viewer (raw `due_count` alias). */
    due_count: string
    /** Cards in the deck the viewer has mastered, repetitions >= 2 (raw `mastered_count` alias). */
    mastered_count: string
}

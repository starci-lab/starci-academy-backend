/** Result of {@link consumeStringChar}: the escape state carried to the NEXT character. */
export interface ConsumeStringCharResult {
    /** Whether the NEXT character is escaped by this one. */
    escaped: boolean
    /** Whether this character closes the JSON string literal. */
    closed: boolean
}

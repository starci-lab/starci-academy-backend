/**
 * Extracts the keyword list out of a flashcard answer's trailing `:::chip`
 * block -- the same scoring checklist coverage checklist authors write at the end of
 * every `answer` field (see `.mount/data/**\/flashcard-decks/**\/cards/*\/*.md`,
 * `# answer` section: `:::chip\nKW1\nKW2\n...\n:::`). One keyword per line,
 * trimmed, blank lines dropped.
 *
 * Self-contained (no FE dependency) -- the FE has an equivalent
 * `parseAnswerKeywords` util for its own (non-AI) cloze-quiz feature; this is
 * a separate, minimal BE port used ONLY to build the kind="theory" grading
 * rubric's coverage checklist, not shared code.
 *
 * @param answer - The flashcard's full (Markdown) answer text, or null.
 * @returns The parsed keywords, in source order (empty when there is no
 *   `:::chip` block, or the answer is null).
 */
export const parseFlashcardAnswerKeywords = (
    answer: string | null,
): Array<string> => {
    if (!answer) {
        return []
    }
    // ":::chip" opens the block, the next bare ":::" closes it -- non-greedy so
    // a later unrelated ":::" block (e.g. another ":::muted" section) never
    // gets swallowed into the match. `[ \t]*\n` (not `\s*\n`) before the capture:
    // `\s` overlaps `\n`, so `\s*` immediately followed by an explicit `\n` is
    // ambiguous about which of them consumes a given newline -- super-linear on
    // pathological input. Any extra blank lines just become leading content in
    // the capture instead, which the caller's per-line trim/filter already discards.
    const match = /:::chip[ \t]*\n([\s\S]*?):::/.exec(answer)
    if (!match) {
        return []
    }
    return match[1]
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
}

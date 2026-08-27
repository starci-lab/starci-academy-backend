import {
    Injectable,
} from "@nestjs/common"
import type {
    ParsedClozeBlank,
    ParsedClozeCard,
} from "./cloze-contract"

const VALID_CLOZE = /\{\{c([1-9]\d*)::([^{}]*)\}\}/gu

@Injectable()
/** Canonical parser for the approved `{{cN::answer::hint}}` grammar. */
export class ClozeParserService {
    parse(
        cardId: string,
        source: string | null | undefined,
    ): ParsedClozeCard {
        const blanks: Array<ParsedClozeBlank> = []
        const occurrenceByIndex = new Map<number, number>()
        const text = (source ?? "").replace(
            VALID_CLOZE,
            (literal: string, rawIndex: string, rawBody: string) => {
                const hintSeparator = rawBody.indexOf("::")
                const rawAnswer = hintSeparator < 0
                    ? rawBody
                    : rawBody.slice(0,
                        hintSeparator)
                const rawHint = hintSeparator < 0
                    ? undefined
                    : rawBody.slice(hintSeparator + 2)
                const answer = rawAnswer.normalize("NFKC").trim()
                if (!answer) {
                    return literal
                }
                const clozeIndex = Number(rawIndex)
                const occurrence = (occurrenceByIndex.get(clozeIndex) ?? 0) + 1
                occurrenceByIndex.set(clozeIndex,
                    occurrence)
                const blankId = `${cardId}:c${clozeIndex}:o${occurrence}`
                const hint = rawHint?.normalize("NFKC").trim() || undefined
                blanks.push({
                    blankId,
                    clozeIndex,
                    occurrence,
                    answer,
                    ...(hint ? {
                        hint
                    } : {
                    }),
                })
                return `{{blank:${blankId}}}`
            },
        )
        return {
            text,
            blanks,
        }
    }

    isEligible(source: string | null | undefined): boolean {
        return this.parse("eligibility",
            source).blanks.length > 0
    }
}

import type {
    CriterionLangProse,
} from "../types/criteria"

/**
 * Pick a criterion's prose for the learner's chosen language; fall back to the first language bucket
 * when the chosen language is absent (e.g. a rubric that omits Go).
 *
 * @param langs - The criterion's per-language prose rows.
 * @param lang - The learner's chosen programming language.
 * @returns The matching (or fallback) prose, or an empty string when there is none.
 */
export function pickLangBody(
    langs: Array<CriterionLangProse> | undefined,
    lang: string | undefined,
): string {
    const list = langs ?? []
    const matched = list.find((entry) => entry.lang === lang)
    return (matched ?? list[0])?.body ?? ""
}

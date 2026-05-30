import type {
    ChallengeDifficulty,
    Locale,
} from "@modules/databases"
import type {
    ResolvedFilePath,
} from "../../../shared"
/** Indices that locate a challenge under mounted course data. */
export interface ParseChallengeParams {
    /** The paths of the challenge. */
    paths: Array<ResolvedFilePath>
    /** The index of the course. */
    courseIndex: number
    /** The index of the module. */
    moduleIndex: number
    /** The index of the content. */
    contentIndex: number
    /** The index of the challenge. */
    challengeIndex: number
}

/** Ordinals locating `modules/{module}/contents/{contentIndex}-{slug}/challenges/` on the course mount. */
export interface ParseChallengeManyParams {
    /** The relative path of the content. */
    contentRelativePath: string
    /** The index of the course. */
    courseIndex: number
    /** The index of the module. */
    moduleIndex: number
    /** The index of the content. */
    contentIndex: number
}

/** Params for listing `challenges/{n}/` folder indices on the mount. */
export interface ChallengeIndexesParams {
    courseIndex: number
    moduleIndex: number
    contentIndex: number
}

/** Sorted `challengeIndex` values found under `modules/{moduleIndex}/challenges/`. */
export type ListChallengeIndexesResult = Array<number>

/** Params for reading the same markdown heading in EN and VI documents. */
export interface ExtractChallengeBlockBothParams {
    /** Heading text without hashes, e.g. `"Title"`. */
    key: string
    enMarkdown: string
    viMarkdown: string
    /** Number of `#` characters for the target heading. */
    numHashs?: number
}

/** English and Vietnamese bodies for one extracted section. */
export interface ExtractChallengeBlockBothResult {
    en: string
    vi: string
}

/** One grading-prompt row from challenge `data.json` (stored per challenge submission slot). */
export interface ChallengeSubmissionPromptJson {
    /** Title of the prompt in English. */
    titleEn: string
    /** Order index of the prompt. */
    orderIndex: number
    score: number
    /** Prompt body in English. */
    textEn: string
    /** Optional Vietnamese title (stored as a translation row). */
    titleVi?: string
    /** Optional Vietnamese body (stored as a translation row). */
    textVi?: string
}

/** Shape of challenge `data.json` beside markdown files. */
export interface ChallengeDataJson {
    /** Difficulty level of the challenge. */
    difficulty: ChallengeDifficulty
    /** Total score for the challenge. */
    score: number
    /**
     * Optional rubric prompts. When omitted or unused, prompts are taken from `# Submissions`
     * bodies (`### N. Title (Xpts)` in `en.md` / `vi.md`) when present.
     */
    prompts?: Array<ChallengeSubmissionPromptJson>
}

/**
 * Inputs for loading SCHEMA V2 submissions from `<challenge>/submissions/<N>/{locale}.md`.
 * Mirrors {@link ParseContentBodiesParams} — same folder-scan + per-locale merge pattern.
 */
export interface ParseChallengeSubmissionsParams {
    /** Challenge folder relative path under `courses/`. */
    challengeRelativePath: string
    /** Course ordinal on the mount. */
    courseIndex: number
    /** Module ordinal within the course. */
    moduleIndex: number
    /** Content ordinal within the module. */
    contentIndex: number
    /** Challenge ordinal within the content. */
    challengeIndex: number
    /** Parent challenge id written into every submission row's FK relation. */
    challengeId: string
}

/**
 * Inputs for parsing one submission's grading rubric under
 * `<challenge>/submissions/<submissionOrderIndex>/en.md` (`# approachCriterias` / `# outcomeCriterias`).
 */
export interface ParseSubmissionCriteriaParams {
    /** Challenge folder relative path under `courses/`. */
    challengeRelativePath: string
    /** Course ordinal on the mount. */
    courseIndex: number
    /** Module ordinal within the course. */
    moduleIndex: number
    /** Content ordinal within the module. */
    contentIndex: number
    /** Challenge ordinal within the content. */
    challengeIndex: number
    /** Submission ordinal — matches `submissions/<n>/` folder name. */
    submissionOrderIndex: number
    /** Parent submission id written into every criteria row's FK relation. */
    submissionId: string
}

/**
 * Inputs for mapping one SCHEMA V2 lang-bucket section (`# requirements`, `# steps`, …) into
 * normalized `*V2` child rows.
 */
export interface MapChallengeLangSectionV2Params {
    /** Per-locale challenge extracts keyed by locale. */
    jsonMap: Map<Locale, Record<string, unknown>>
    /** Mount section key. */
    section: "requirements" | "steps" | "outputs" | "prerequisites"
    /** Parent challenge id for FK relations. */
    challengeId: string
    /** Course ordinal on the mount. */
    courseIndex: number
    /** Module ordinal within the course. */
    moduleIndex: number
    /** Content ordinal within the module. */
    contentIndex: number
    /** Challenge ordinal within the content. */
    challengeIndex: number
    /** Whether items carry an agnostic `title` (per-locale translations). */
    hasTitle: boolean
    /** Whether language rows carry a `score` field. */
    hasScore: boolean
    /** FK column on the item-level title translation row. */
    titleTranslationParentIdKey: string
    /** FK column on the lang-level body translation row. */
    langTranslationParentIdKey: string
    /** Relation property on the lang row pointing back to its item (`requirementV2`, `stepV2`, …). */
    langItemRelationKey: string
    /** Factory for the item row id. */
    generateItemId: (itemIndex: number) => string
    /** Factory for the (item × programming-language) lang row id. */
    generateLangId: (itemIndex: number, langOrderIndex: number) => string
}

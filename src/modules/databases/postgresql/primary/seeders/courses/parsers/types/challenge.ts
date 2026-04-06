import type {
    ChallengeDifficulty,
} from "../../../../enums"

/** Indices that locate a challenge under mounted course data. */
export interface ParseChallengeParams {
    courseIndex: number
    moduleIndex: number
    challengeIndex: number
}

/** Params for listing `challenges/{n}/` folder indices on the mount. */
export interface ChallengeIndexesParams {
    courseIndex: number
    moduleIndex: number
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
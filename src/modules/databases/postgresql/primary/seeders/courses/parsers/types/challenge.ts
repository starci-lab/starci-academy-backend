import {
    ResolvedFilePath,
} from "../../path"
import type {
    ChallengeDifficulty,
} from "../../../../enums"

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
import type {
    Locale,
} from "@modules/databases"
import {
    ResolvedFilePath,
} from "../../path"

/** One aligned i18n translation row carried by a merged milestone-task block. */
export interface MilestoneTaskTranslation {
    /** The locale this value belongs to. */
    locale: Locale
    /** The dot-path field name being translated (e.g. `title`). */
    field: string
    /** The translated value for this locale. */
    value: string
}

/**
 * One outcome/approach grading criterion as authored under a language block (`#### N` →
 * `{ body, score, critical }`). Outcome prose is agnostic; approach prose differs per language.
 */
export interface MergedCriterion {
    /** Criterion prose body (Markdown). */
    body?: string
    /** Points awarded for satisfying this criterion. */
    score?: unknown
    /** Whether this criterion is a critical (gating) requirement. */
    critical?: unknown
    /** Evaluation order. */
    orderIndex?: unknown
    /** Pure display-ordering index (decoupled from orderIndex). */
    sortIndex?: unknown
}

/**
 * One per-language brief block (`# criterias` → `## N`) after extract+merge: the learner-facing
 * `body` carries aligned `translations[]`; `outcome`/`approach` are English-only criterion lists.
 */
export interface MergedLangBlock {
    /** The language this brief block targets. */
    lang?: string
    /** Learner-facing brief prose (i18n, carries aligned translations). */
    body?: string
    /** Outcome rubric criteria (agnostic across languages). */
    outcome?: Array<MergedCriterion>
    /** Approach rubric criteria (per-language prose). */
    approach?: Array<MergedCriterion>
    /** Evaluation order. */
    orderIndex?: unknown
    /** Pure display-ordering index (decoupled from orderIndex). */
    sortIndex?: unknown
    /** Aligned i18n translation rows for this block's `body`. */
    translations?: Array<MilestoneTaskTranslation>
}

/**
 * Default-locale milestone-task doc produced by the merge service: scalar headings plus the
 * lang-first `criterias` blocks and the task-level `translations[]`.
 */
export interface MergedMilestoneTask {
    /** Task title. */
    title?: string
    /** Task description. */
    description?: string
    /** Task type string from `# type`. */
    type?: string
    /** Grading weight of this task. */
    weight?: unknown
    /** Evaluation order. */
    orderIndex?: unknown
    /** Pure display-ordering index (decoupled from orderIndex). */
    sortIndex?: unknown
    /** Maximum achievable score. */
    maxScore?: unknown
    /** Relative difficulty string from `# difficulty` (easy/medium/hard/insane). */
    difficulty?: string
    /** SCHEMA V2 verification marker (non-null marks rubric-graded). */
    verified?: unknown
    /** Per-language brief blocks (`# criterias` → `## N`). */
    criterias?: Array<MergedLangBlock>
    /** Aligned i18n translation rows for the task itself. */
    translations?: Array<MilestoneTaskTranslation>
}

/** Ordinals locating `milestones/{milestoneIndex}-{slug}/` on the course mount. */
export interface ParseMilestoneParams {
    /** The paths of the milestone. */
    paths: Array<ResolvedFilePath>
    /** The index of the course. */
    courseIndex: number
    /** The index of the milestone. */
    milestoneIndex: number
}

/** Ordinals locating `milestones/` on the course mount. */
export interface ParseMilestoneManyParams {
    /** The relative path of the course. */
    courseRelativePath: string
    /** The index of the course. */
    courseIndex: number
}

/** Ordinals locating `milestones/{milestone}/tasks/{taskIndex}-{slug}/` on the course mount. */
export interface ParseMilestoneTaskParams {
    /** The paths of the task. */
    paths: Array<ResolvedFilePath>
    /** The index of the course. */
    courseIndex: number
    /** The index of the milestone. */
    milestoneIndex: number
    /** The index of the task. */
    taskIndex: number
}

/** Ordinals locating `milestones/{milestone}/tasks/` on the course mount. */
export interface ParseMilestoneTaskManyParams {
    /** The relative path of the milestone. */
    milestoneRelativePath: string
    /** The index of the course. */
    courseIndex: number
    /** The index of the milestone. */
    milestoneIndex: number
}


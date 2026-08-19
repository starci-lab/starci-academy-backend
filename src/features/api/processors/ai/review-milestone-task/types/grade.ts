import type {
    ProjectEvaluation,
} from "@modules/integrations/bullmq/types/evaluation/project-evaluation"
import type {
    GradingStepAiUsage,
} from "@modules/ai/types/grading"
import type {
    MilestoneTaskCriteriaEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task-criteria.entity"
import type {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import type {
    ResolvedChallengeCriterion,
} from "../../shared/challenge-submission/types/criteria"

/**
 * Review milestone task grade result interface.
 */
export interface ReviewMilestoneTaskGradeResult {
    /** The evaluation result. */
    evaluation: ProjectEvaluation
    /** Whether the task passed. */
    passed: boolean
    /** Model/provider actually used by the balancer for this run. */
    aiUsage: GradingStepAiUsage
}

/** Params to load a submission's GitHub repo and map loader failures to a domain exception. */
export interface LoadGithubDocumentsParams {
    /** The repo URL to clone. */
    repoUrl: string
    /** The branch to clone. */
    branch: string
    /** The enrollment whose stored token should authenticate the clone, if any. */
    enrollmentId: string
}

/** Params to resolve which criteria set grades a milestone task. */
export interface ResolveGradingCriteriaParams {
    /** The task being graded. */
    milestoneTask: MilestoneTaskEntity
    /** The task's legacy (non-V2) criteria. */
    criteria: Array<MilestoneTaskCriteriaEntity>
    /** The learner's chosen language, used to resolve V2 per-language criteria bodies. */
    lang: string | undefined
}

/** The criteria set resolved for one grading run, plus its derived retrieval queries and max score. */
export interface ResolvedGradingCriteria {
    /** Whether this task grades against the SCHEMA V2 (per-language yes/no) criteria. */
    isV2Task: boolean
    /** The resolved V2 criteria (empty for legacy tasks). */
    v2Criteria: Array<ResolvedChallengeCriterion>
    /** Criteria mapped to retrieval queries (V2 yes/no body, else legacy text + prompt). */
    retrievalCriteria: Array<{ body: string }>
    /** V2 max total = sum of explicit criterion scores; legacy = task.maxScore. */
    gradeMaxScore: number
}

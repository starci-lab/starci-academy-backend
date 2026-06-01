import type {
    DeepPartial,
} from "typeorm"
import type {
    ContentEntity,
    CourseEntity,
    MilestoneEntity,
    ModuleEntity,
} from "@modules/databases"
import type {
    ResolvedFileResult,
} from "../../shared"
import type {
    CourseIndexFilterByDisplayId,
} from "../../../types"

/** {@link CourseProcessorService.process} input. */
export interface ProcessCoursesParams {
    /** Parsed course mount files. */
    courseResults: Array<ResolvedFileResult<DeepPartial<CourseEntity>>>
    /** Module index filter from seed scope. */
    moduleIndexFilterByDisplayId: CourseIndexFilterByDisplayId | null
    /** Milestone index filter from seed scope. */
    milestoneIndexFilterByDisplayId: CourseIndexFilterByDisplayId | null
    /** When true, parse and upsert quiz decks per course. */
    quizEnabled: boolean
    /** When true, build content path → id map for quiz N:N links. */
    quizLinkContents: boolean
}

/** {@link ModuleProcessorService.process} input. */
export interface ProcessModulesParams {
    /** Current course parse result. */
    courseResult: ResolvedFileResult<DeepPartial<CourseEntity>>
    /** Module index filter from seed scope. */
    moduleIndexFilterByDisplayId: CourseIndexFilterByDisplayId | null
    /** When true, populate {@link ProcessModulesResult.contentIdByPath}. */
    quizLinkContents: boolean
}

/** {@link ModuleProcessorService.process} output (reserved for quiz link map). */
export interface ProcessModulesResult {
    /** `moduleDisplayId/contentDisplayId` → content id for quiz linking. */
    contentIdByPath: Map<string, string>
}

/** {@link ContentProcessorService.process} input. */
export interface ProcessContentsParams {
    /** Owning course parse result. */
    courseResult: ResolvedFileResult<DeepPartial<CourseEntity>>
    /** Owning module parse result. */
    moduleResult: ResolvedFileResult<DeepPartial<ModuleEntity>>
}

/** {@link ChallengeProcessorService.process} input. */
export interface ProcessChallengesParams {
    /** Owning course parse result. */
    courseResult: ResolvedFileResult<DeepPartial<CourseEntity>>
    /** Owning module parse result. */
    moduleResult: ResolvedFileResult<DeepPartial<ModuleEntity>>
    /** Content parse result to load challenges for. */
    contentResult: ResolvedFileResult<DeepPartial<ContentEntity>>
}

/** {@link QuizDeckProcessorService.process} input. */
export interface ProcessQuizDecksParams {
    /** Matching course parse result. */
    courseResult: ResolvedFileResult<DeepPartial<CourseEntity>>
}

/** {@link MilestoneProcessorService.process} input. */
export interface ProcessMilestonesParams {
    /** Course primary key. */
    courseId: string
    /** Course display id for milestone scope filter. */
    courseDisplayId: string
    /** Matching course parse result, if any. */
    courseResult: ResolvedFileResult<DeepPartial<CourseEntity>>
}

/** {@link MilestoneTaskProcessorService.process} input. */
export interface ProcessMilestoneTasksParams {
    /** Owning course id. */
    courseId: string
    /** Owning course parse result. */
    courseResult: ResolvedFileResult<DeepPartial<CourseEntity>>
    /** Parsed milestone file result. */
    milestoneResult: ResolvedFileResult<DeepPartial<MilestoneEntity>>
}

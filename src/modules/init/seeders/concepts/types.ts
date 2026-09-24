import type {
    DeepPartial,
} from "typeorm"
import type {
    ConceptEntity,
} from "@modules/databases/postgresql/primary/entities/concept.entity"
import type {
    ResolvedFilePath,
} from "../shared/path/types"

/** Supported learner difficulty bands for a concept. */
export type ConceptDifficulty = "foundation" | "intermediate" | "advanced"

/** Supported phases for an ordered concept section. */
export type ConceptSectionPhase =
    | "challenge"
    | "predict"
    | "explore"
    | "explain"
    | "apply"
    | "reflect"

/** Supported interactive activity variants. */
export type ConceptActivityKind =
    | "choice"
    | "exercise"
    | "explain"
    | "retrieval"
    | "simulation"

/** One localized learning outcome or prerequisite. */
export interface ConceptLearningOutcome {
    id: string
    text: string
}

/** One localized external or cited reference. */
export interface ConceptReference {
    id: string
    label: string
    url?: string
    citation?: string
}

/** One workspace file made available to a learner. */
export interface ConceptWorkspaceFile {
    path: string
    role: "source" | "test" | "support"
}

/** Runtime and file metadata for a concept workspace. */
export interface ConceptWorkspace {
    runtime: string
    files: Array<ConceptWorkspaceFile>
    commands?: {
        windows?: string
        unix?: string
    }
}

/** One selectable answer in a choice activity. */
export interface ConceptActivityOption {
    id: string
    label: string
    explanation?: string
    isCorrect?: boolean
}

/** Private authored answer feedback for an activity. */
export interface ConceptActivityAnswer {
    explanation: string
    sampleAnswer?: string
    misconception?: string
}

/** One private scoring criterion for an activity. */
export interface ConceptRubricCriterion {
    id: string
    criterion: string
    expectedEvidence: string
    misconception?: string
    maxScore: number
}

/** One state in an authored simulation. */
export interface ConceptSimulationState {
    id: string
    label: string
    observation: string
    isSuccess: boolean
}

/** One action available in an authored simulation. */
export interface ConceptSimulationAction {
    id: string
    label: string
}

/** One state transition in an authored simulation. */
export interface ConceptSimulationTransition {
    id: string
    fromStateId: string
    actionId: string
    toStateId: string
}

/** Private state-machine data for a simulation activity. */
export interface ConceptSimulation {
    engine: string
    initialStateId: string
    debriefQuestion?: string
    states: Array<ConceptSimulationState>
    actions: Array<ConceptSimulationAction>
    transitions: Array<ConceptSimulationTransition>
}

/** One embedded exercise file retained from the source mount. */
export interface ConceptExerciseFile {
    relativePath: string
    role: string
    syntaxLanguage?: string
    content: string
    sha256: string
}

/** One private executable verification check for an exercise. */
export interface ConceptExerciseCheck {
    id?: string
    runner: string
    entrypoint: string
    expectedExitCode: number
    scope?: string
    runtime?: string
    executionStatus?: string
}

/** Private submission and verification data for an exercise. */
export interface ConceptExercise {
    submissionInstructions: string
    verificationMode: string
    verificationInstructions: string
    files?: Array<ConceptExerciseFile>
    checks?: Array<ConceptExerciseCheck>
}

/** One authored activity stored in private JSONB. */
export interface ConceptActivity {
    id: string
    kind: ConceptActivityKind
    stableKey?: string
    placementSortIndex?: number
    prompt: string
    responseKind?: string
    evaluationMethod?: string
    isDiagnostic?: boolean
    feedbackRelease?: string
    outcomeIds?: Array<string>
    afterDays?: number
    options?: Array<ConceptActivityOption>
    answer?: ConceptActivityAnswer
    hints?: Array<string>
    rubric?: Array<ConceptRubricCriterion>
    simulation?: ConceptSimulation
    exercise?: ConceptExercise
}

/** Unvalidated root Markdown leaves extracted from one concept locale. */
export interface RawConceptMount {
    [key: string]: unknown
    title?: unknown
    description?: unknown
    category?: unknown
    difficulty?: unknown
    minutesRead?: unknown
    implementation?: unknown
    sortIndex?: unknown
    body?: unknown
    learningOutcomes?: unknown
    prerequisites?: unknown
    references?: unknown
    workspace?: unknown
    activities?: unknown
}

/** Unvalidated Markdown leaves extracted from one section locale. */
export interface RawConceptSectionMount {
    [key: string]: unknown
    title?: unknown
    phase?: unknown
    sortIndex?: unknown
    body?: unknown
    activities?: unknown
}

/** Validated locale-specific visible and private fields for one concept. */
export interface LocalizedConceptMount {
    title: string
    description: string
    body: string | null
    learningOutcomes: Array<ConceptLearningOutcome> | null
    prerequisites: Array<ConceptLearningOutcome> | null
    references: Array<ConceptReference> | null
    activities: Array<ConceptActivity> | null
}

/** Validated locale-specific visible and private fields for one section. */
export interface LocalizedConceptSectionMount {
    title: string
    body: string
    activities: Array<ConceptActivity> | null
}

/** Inputs used to compare concept metadata and structural identities across locales. */
export interface ConceptInvariantParams {
    owner: string
    english: RawConceptMount
    localized: RawConceptMount
    englishCopy: LocalizedConceptMount
    localizedCopy: LocalizedConceptMount
    orderIndex: number
}

/** Inputs used to compare section metadata and activity topology across locales. */
export interface ConceptSectionInvariantParams {
    owner: string
    english: RawConceptSectionMount
    localized: RawConceptSectionMount
    englishCopy: LocalizedConceptSectionMount
    localizedCopy: LocalizedConceptSectionMount
    orderIndex: number
}

/** One parsed concept and its resolved mount path. */
export interface ParsedConceptMount {
    concept: DeepPartial<ConceptEntity>
    path: ResolvedFilePath
}

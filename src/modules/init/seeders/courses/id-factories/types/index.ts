/**
 * Input for {@link CourseIdFactoryService.generate}.
 */
export interface GenerateCourseIdParams {
    /**
     * Zero-based position of the course in the seeded course list.
     */
    courseIndex: number
}

/**
 * Input for {@link ModuleIdFactoryService.generate}.
 */
export interface GenerateModuleIdParams {
    /**
     * Zero-based course index (same as {@link GenerateCourseIdParams.courseIndex}).
     */
    courseIndex: number
    /**
     * Zero-based module index within that course (matches mount folder order).
     */
    moduleIndex: number
}

/**
 * Input for {@link ContentIdFactoryService.generate}.
 */
export interface GenerateContentIdParams {
    /** Parent course ordinal. */
    courseIndex: number
    /** Parent module ordinal. */
    moduleIndex: number
    /** Zero-based content slot under `modules/{moduleIndex}/contents/{contentIndex}`. */
    contentIndex: number
}


/**
 * Input for {@link CodeExplainingIdFactoryService.generate}.
 */
export interface GenerateCodeExplainingIdParams {
    /** Parent course ordinal. */
    courseIndex: number
    /** Parent module ordinal. */
    moduleIndex: number
    /** Parent content ordinal. */
    contentIndex: number
    /** Zero-based code-explaining block index within the content. */
    explainingIndex: number
}

/**
 * Input for {@link CodeImplementationIdFactoryService.generate}.
 */
export interface GenerateCodeImplementationIdParams {
    /** Parent course ordinal. */
    courseIndex: number
    /** Parent module ordinal. */
    moduleIndex: number
    /** Parent content ordinal. */
    contentIndex: number
    /** Zero-based code-implementation block index within the content. */
    implementationIndex: number
}

/**
 * Input for {@link ContentBodyIdFactoryService.generate}.
 */
export interface GenerateContentBodyIdParams {
    /** Parent course ordinal. */
    courseIndex: number
    /** Parent module ordinal. */
    moduleIndex: number
    /** Parent content ordinal. */
    contentIndex: number
    /** Zero-based programming-language bucket order within the content (`bodies/<orderIndex>-<lang>/`). */
    orderIndex: number
}

/**
 * Input for {@link ContentLearningOutcomeIdFactoryService.generate}.
 */
export interface GenerateContentLearningOutcomeIdParams {
    /** Parent course ordinal. */
    courseIndex: number
    /** Parent module ordinal. */
    moduleIndex: number
    /** Parent content ordinal. */
    contentIndex: number
    /** Zero-based outcome bullet order within the content's `# outcomes` list. */
    orderIndex: number
}

/**
 * Input for {@link PreviewContentIdFactoryService.generate}.
 */
export interface GeneratePreviewContentIdParams {
    /** Parent course ordinal. */
    courseIndex: number
    /** Parent module ordinal. */
    moduleIndex: number
    /** Zero-based bullet in the module markdown “Preview Contents” list. */
    previewContentIndex: number
}

/**
 * Input for {@link PricingPhaseIdFactoryService.generate}.
 */
export interface GeneratePricingPhaseIdParams {
    /** Course that owns the pricing tier row. */
    courseIndex: number
    /** Tier order (e.g. 0 = pioneer, 1 = early bird, 2 = regular). */
    phaseIndex: number
}

/**
 * Input for {@link ValuePropositionIdFactoryService.generate}.
 */
export interface GenerateValuePropositionIdParams {
    /** Owning course ordinal. */
    courseIndex: number
    /** Zero-based line in the course “Value Propositions” list. */
    valuePropositionIndex: number
}

/**
 * Input for {@link PrerequisiteIdFactoryService.generate}.
 */
export interface GeneratePrerequisiteIdParams {
    /** Owning course ordinal. */
    courseIndex: number
    /** Zero-based line in the course “Prerequisites” list. */
    prerequisiteIndex: number
}

/**
 * Input for {@link QnaIdFactoryService.generate}.
 */
export interface GenerateQnaIdParams {
    /** Owning course ordinal. */
    courseIndex: number
    /** Zero-based FAQ entry (`## 1.` → index 0 if ordered contiguously). */
    qnaIndex: number
}

/**
 * Input for {@link LivestreamSessionIdFactoryService.generate}.
 */
export interface GenerateLivestreamSessionIdParams {
    /** Owning course ordinal. */
    courseIndex: number
    /** Session slot index from seed `data.json` (`orderIndex`). */
    sessionIndex: number
}

/**
 * Input for {@link ChallengeIdFactoryService.generate}.
 */
export interface GenerateChallengeIdParams {
    /** Parent course ordinal. */
    courseIndex: number
    /** Parent module ordinal. */
    moduleIndex: number
    /** Parent content ordinal. */
    contentIndex: number
    /** Zero-based challenge folder under `modules/{m}/contents/{c}/challenges/{challengeIndex}`. */
    challengeIndex: number
}

/**
 * Input for {@link ChallengeRequirementIdFactoryService.generate}.
 *
 * Item row: pass `orderIndex` only.
 * Lang row: pass `requirementIndex` (parent item) and `orderIndex` (language bucket).
 */
export interface GenerateChallengeRequirementIdParams {
    /** Parent course ordinal. */
    courseIndex: number
    /** Parent module ordinal. */
    moduleIndex: number
    /** Parent content ordinal. */
    contentIndex: number
    /** Parent challenge ordinal. */
    challengeIndex: number
    /** Requirement item ordinal — item id when passed alone; lang bucket ordinal with `requirementIndex`. */
    orderIndex?: number
    /** Parent requirement item ordinal — lang id when paired with `orderIndex`. */
    requirementIndex?: number
}

/**
 * Input for {@link ChallengeStepIdFactoryService.generate}.
 *
 * Item row: pass `orderIndex` only.
 * Lang row: pass `stepIndex` (parent item) and `orderIndex` (language bucket).
 */
export interface GenerateChallengeStepIdParams {
    /** Parent course ordinal. */
    courseIndex: number
    /** Parent module ordinal. */
    moduleIndex: number
    /** Parent content ordinal. */
    contentIndex: number
    /** Parent challenge ordinal. */
    challengeIndex: number
    /** Step item ordinal — item id when passed alone; lang bucket ordinal with `stepIndex`. */
    orderIndex?: number
    /** Parent step item ordinal — lang id when paired with `orderIndex`. */
    stepIndex?: number
}

/**
 * Input for {@link ChallengeOutputIdFactoryService.generate}.
 *
 * Item row: pass `orderIndex` only.
 * Lang row: pass `outputIndex` (parent item) and `orderIndex` (language bucket).
 */
export interface GenerateChallengeOutputIdParams {
    /** Parent course ordinal. */
    courseIndex: number
    /** Parent module ordinal. */
    moduleIndex: number
    /** Parent content ordinal. */
    contentIndex: number
    /** Parent challenge ordinal. */
    challengeIndex: number
    /** Output item ordinal — item id when passed alone; lang bucket ordinal with `outputIndex`. */
    orderIndex?: number
    /** Parent output item ordinal — lang id when paired with `orderIndex`. */
    outputIndex?: number
}

/**
 * Input for {@link ChallengePrerequisiteIdFactoryService.generate}.
 *
 * Item row: pass `orderIndex` only.
 * Lang row: pass `prerequisiteIndex` (parent item) and `orderIndex` (language bucket).
 */
export interface GenerateChallengePrerequisiteIdParams {
    /** Parent course ordinal. */
    courseIndex: number
    /** Parent module ordinal. */
    moduleIndex: number
    /** Parent content ordinal. */
    contentIndex: number
    /** Parent challenge ordinal. */
    challengeIndex: number
    /** Prerequisite item ordinal — item id when passed alone; lang bucket ordinal with `prerequisiteIndex`. */
    orderIndex?: number
    /** Parent prerequisite item ordinal — lang id when paired with `orderIndex`. */
    prerequisiteIndex?: number
}


/**
 * Input for {@link ChallengeSubmissionIdFactoryService.generate}.
 */
export interface GenerateChallengeSubmissionIdParams {
    /** Parent course ordinal (locates the parent challenge). */
    courseIndex: number
    /** Parent module ordinal (locates the parent challenge). */
    moduleIndex: number
    /** Parent content ordinal (locates the parent challenge). */
    contentIndex: number
    /** Parent challenge ordinal (locates the parent challenge). */
    challengeIndex: number
    /** Zero-based submission definition from the challenge markdown (`## Submissions` indexed list). */
    submissionIndex: number
}

/**
 * Input for {@link ChallengeSubmissionPromptIdFactoryService.generate}.
 */
export interface GenerateChallengeSubmissionPromptIdParams {
    /** Parent course ordinal (locates the parent submission). */
    courseIndex: number
    /** Parent module ordinal (locates the parent submission). */
    moduleIndex: number
    /** Parent content ordinal (locates the parent submission). */
    contentIndex: number
    /** Parent challenge ordinal (locates the parent submission). */
    challengeIndex: number
    /** Parent submission ordinal (locates the parent submission). */
    submissionIndex: number
    /** Zero-based prompt in the submission definition list. */
    promptIndex: number
}

/**
 * Input for {@link ChallengeSubmissionCriteriaIdFactoryService.generate} — the SCHEMA V2 grading
 * rubric buckets authored under `criterias/<submissionIndex>/{approach,outcome}.md`. One id per
 * (submission × kind × programming-language).
 */
export interface GenerateChallengeSubmissionCriteriaIdParams {
    /** Parent course ordinal (locates the parent submission). */
    courseIndex: number
    /** Parent module ordinal (locates the parent submission). */
    moduleIndex: number
    /** Parent content ordinal (locates the parent submission). */
    contentIndex: number
    /** Parent challenge ordinal (locates the parent submission). */
    challengeIndex: number
    /** Parent submission ordinal (locates the parent submission). */
    submissionIndex: number
    /** Rubric kind — `approach` (per-language how-to) or `outcome` (observable behaviour). */
    kind: "approach" | "outcome"
    /** Zero-based criterion index within the rubric file (`# 0`, `# 1`, …). */
    criterionIndex: number
}

/**
 * Input for {@link ChallengeSubmissionCriteriaIdFactoryService.generateLang} — one id per
 * (criterion × programming-language) prose row under a criterion.
 */
export interface GenerateChallengeSubmissionCriteriaLangIdParams extends GenerateChallengeSubmissionCriteriaIdParams {
    /** Zero-based programming-language variant index within the criterion (0-typescript, 1-java, …). */
    langIndex: number
}

/**
 * Input for {@link ChallengeSubmissionPromptCriteriaIdFactoryService.generate}.
 */
export interface GenerateChallengeSubmissionPromptCriteriaIdParams {
    /** Parent course ordinal. */
    courseIndex: number
    /** Parent module ordinal. */
    moduleIndex: number
    /** Parent content ordinal. */
    contentIndex: number
    /** Parent challenge ordinal. */
    challengeIndex: number
    /** Parent submission ordinal. */
    submissionIndex: number
    /** Parent prompt ordinal. */
    promptIndex: number
    /** Zero-based grading criteria index within the prompt. */
    criteriaIndex: number
}

/**
 * Input for {@link FlashcardDeckIdFactoryService.generate}.
 */
export interface GenerateFlashcardDeckIdParams {
    /** Parent course ordinal. */
    courseIndex: number
    /** Zero-based deck folder under `courses/{course}/flashcard-decks/{flashcardDeckIndex}`. */
    flashcardDeckIndex: number
}

/**
 * Input for {@link FlashcardCardIdFactoryService.generate}.
 */
export interface GenerateFlashcardCardIdParams {
    /** Parent course ordinal. */
    courseIndex: number
    /** Parent deck ordinal. */
    flashcardDeckIndex: number
    /** Zero-based card index within the deck. */
    flashcardCardIndex: number
}

/**
 * Input for {@link MockInterviewIdFactoryService.generate} — one authored
 * mock-interview question. Banks have no entity/id of their own (a bank is
 * just a `bankSlug` grouping folder), so the question id hashes the bank +
 * question ordinals directly off the owning course.
 */
export interface GenerateMockInterviewIdParams {
    /** Parent course ordinal. */
    courseIndex: number
    /** Zero-based bank folder under `courses/{course}/mock-interview/{bankIndex}`. */
    bankIndex: number
    /** Zero-based question folder under the bank's `questions/{questionIndex}`. */
    questionIndex: number
}

/**
 * Input for {@link MockInterviewLangIdFactoryService.generate} — one
 * per-programming-language `givenCode` variant of a mock-interview question.
 */
export interface GenerateMockInterviewLangIdParams {
    /** Parent course ordinal. */
    courseIndex: number
    /** Parent bank ordinal. */
    bankIndex: number
    /** Parent question ordinal. */
    questionIndex: number
    /** Zero-based language-variant index within the question's `# langs` list. */
    langIndex: number
}

/**
 * Input for {@link MilestoneIdFactoryService.generate}.
 */
export interface GenerateMilestoneIdParams {
    /**
     * Zero-based course index.
     */
    courseIndex: number
    /**
     * Zero-based milestone index within the course.
     */
    milestoneIndex: number
}

/**
 * Input for {@link MilestoneTaskIdFactoryService.generate}.
 */
export interface GenerateMilestoneTaskIdParams {
    /** Owning course ordinal. */
    courseIndex: number
    /** Owning milestone ordinal. */
    milestoneIndex: number
    /** Zero-based task index within the milestone. */
    taskIndex: number
}

/**
 * Input for {@link MilestoneTaskPassCriteriaIdFactoryService.generate}.
 */
export interface GenerateMilestoneTaskPassCriteriaIdParams {
    /** Owning course ordinal. */
    courseIndex: number
    /** Owning milestone ordinal. */
    milestoneIndex: number
    /** Owning task ordinal. */
    taskIndex: number
    /** Zero-based pass criteria index within the task. */
    criteriaIndex: number
}

/**
 * Input for {@link MilestoneTaskCodeImplementationIdFactoryService.generate}.
 */
export interface GenerateMilestoneTaskCodeImplementationIdParams {
    /** Owning course ordinal. */
    courseIndex: number
    /** Owning milestone ordinal. */
    milestoneIndex: number
    /** Owning task ordinal. */
    taskIndex: number
    /** Zero-based code-implementation index within the task. */
    implementationIndex: number
}

/**
 * Input for {@link MilestoneTaskBriefIdFactoryService.generate} — one SCHEMA V2 per-language
 * learner-facing brief (`merged.criterias[briefIndex]`).
 */
export interface GenerateMilestoneTaskBriefIdParams {
    /** Owning course ordinal. */
    courseIndex: number
    /** Owning milestone ordinal. */
    milestoneIndex: number
    /** Owning task ordinal. */
    taskIndex: number
    /** Zero-based brief (language block) index within the task. */
    briefIndex: number
}

/**
 * Input for {@link MilestoneTaskOutcomeCriteriaIdFactoryService.generate} — one SCHEMA V2 OUTCOME
 * criterion (agnostic across the per-language brief blocks).
 */
export interface GenerateMilestoneTaskOutcomeCriteriaIdParams {
    /** Owning course ordinal. */
    courseIndex: number
    /** Owning milestone ordinal. */
    milestoneIndex: number
    /** Owning task ordinal. */
    taskIndex: number
    /** Zero-based outcome criterion index within the task. */
    criterionIndex: number
}

/**
 * Input for {@link MilestoneTaskOutcomeCriteriaLangIdParams.generate} — one per-language prose row
 * under a SCHEMA V2 outcome criterion.
 */
export interface GenerateMilestoneTaskOutcomeCriteriaLangIdParams extends GenerateMilestoneTaskOutcomeCriteriaIdParams {
    /** Zero-based programming-language brief-block index within the criterion. */
    langIndex: number
}

/**
 * Input for {@link MilestoneTaskApproachCriteriaIdFactoryService.generate} — one SCHEMA V2 APPROACH
 * criterion (per-language prose differs across brief blocks).
 */
export interface GenerateMilestoneTaskApproachCriteriaIdParams {
    /** Owning course ordinal. */
    courseIndex: number
    /** Owning milestone ordinal. */
    milestoneIndex: number
    /** Owning task ordinal. */
    taskIndex: number
    /** Zero-based approach criterion index within the task. */
    criterionIndex: number
}

/**
 * Input for {@link MilestoneTaskApproachCriteriaLangIdParams.generate} — one per-language prose row
 * under a SCHEMA V2 approach criterion.
 */
export interface GenerateMilestoneTaskApproachCriteriaLangIdParams extends GenerateMilestoneTaskApproachCriteriaIdParams {
    /** Zero-based programming-language brief-block index within the criterion. */
    langIndex: number
}

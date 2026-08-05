import type {
    ChallengeEntity,
    ContentEntity,
    CourseEntity,
    MilestoneEntity,
    MilestoneTaskEntity,
    ModuleEntity,
} from "@modules/databases"
import type {
    SynchronizerSyncScope,
} from "../types"
import {
    shouldIncludeCourseModule,
    shouldIncludeCourseMilestone,
} from "./course-module-filter"

/**
 * Course-root gate: skip rows with no `displayId` (cannot match `seed.yaml`)
 * and skip tracks not explicitly enabled. Missing map entry means off -- otherwise
 * a typo would sync every course.
 */
export const shouldSyncCourseEntity = (
    scope: SynchronizerSyncScope,
    course: CourseEntity,
): boolean => {
    const courseDisplayId = course.displayId
    if (!courseDisplayId) {
        return false
    }
    return scope.courseEnabledByDisplayId.get(courseDisplayId) === true
}

/**
 * Module gate: fail-open when the parent course was not hydrated (avoids
 * silently dropping rows on a partial load); otherwise apply the per-course
 * module-index allow-list from `seed.yaml`.
 */
export const shouldSyncModuleEntity = (
    scope: SynchronizerSyncScope,
    module: ModuleEntity,
): boolean => {
    const courseDisplayId = module.course?.displayId
    if (!courseDisplayId) {
        return true
    }
    return shouldIncludeCourseModule(
        scope.moduleIndexFilterByDisplayId,
        courseDisplayId,
        module.orderIndex,
    )
}

/**
 * Content gate: inherit the parent module allow-list. Fail-open when the
 * module->course chain is missing so a builder that loaded content alone still
 * syncs.
 */
export const shouldSyncContentEntity = (
    scope: SynchronizerSyncScope,
    content: ContentEntity,
): boolean => {
    const courseDisplayId = content.module?.course?.displayId
    const moduleOrderIndex = content.module?.orderIndex
    if (!courseDisplayId || moduleOrderIndex === undefined) {
        return true
    }
    return shouldIncludeCourseModule(
        scope.moduleIndexFilterByDisplayId,
        courseDisplayId,
        moduleOrderIndex,
    )
}

/**
 * Challenge gate: same inherit-from-module rule as content (challenges live
 * under a lesson). Fail-open without the hydrated chain.
 */
export const shouldSyncChallengeEntity = (
    scope: SynchronizerSyncScope,
    challenge: ChallengeEntity,
): boolean => {
    const courseDisplayId = challenge.content?.module?.course?.displayId
    const moduleOrderIndex = challenge.content?.module?.orderIndex
    if (!courseDisplayId || moduleOrderIndex === undefined) {
        return true
    }
    return shouldIncludeCourseModule(
        scope.moduleIndexFilterByDisplayId,
        courseDisplayId,
        moduleOrderIndex,
    )
}

/**
 * Milestone gate: separate allow-list from modules so a course can sync lessons
 * without capstone milestones (and vice versa). Fail-open without course /
 * orderIndex.
 */
export const shouldSyncMilestoneEntity = (
    scope: SynchronizerSyncScope,
    milestone: MilestoneEntity,
): boolean => {
    const courseDisplayId = milestone.course?.displayId
    if (!courseDisplayId) {
        return true
    }
    const milestoneOrderIndex = milestone.orderIndex
    if (milestoneOrderIndex === undefined) {
        return true
    }
    return shouldIncludeCourseMilestone(
        scope.milestoneIndexFilterByDisplayId,
        courseDisplayId,
        milestoneOrderIndex,
    )
}

/**
 * Milestone-task gate: no independent task filter in `seed.yaml` -- a task
 * follows its parent milestone. Fail-open when the milestone relation is absent.
 */
export const shouldSyncMilestoneTaskEntity = (
    scope: SynchronizerSyncScope,
    milestoneTask: MilestoneTaskEntity,
): boolean => {
    const milestone = milestoneTask.milestone
    if (!milestone) {
        return true
    }
    return shouldSyncMilestoneEntity(scope,
        milestone)
}

/**
 * Sink-level track switches (foundations / headhunting / flashcards /
 * coding problems). Lets a synchronizer skip whole indexes without walking rows
 * when that track is off in `seed.yaml`.
 */
export const shouldSynchronizerSyncEntityKind = (
    scope: SynchronizerSyncScope,
    entityKind: string,
    foundationKinds: Array<string>,
    headhuntingKinds: Array<string>,
    flashcardKinds: Array<string>,
    codingProblemKinds: Array<string>,
): boolean => {
    if (!scope.foundations && foundationKinds.includes(entityKind)) {
        return false
    }
    if (!scope.headhunting && headhuntingKinds.includes(entityKind)) {
        return false
    }
    // gate the standalone flashcard-deck search index behind its scope flag
    if (!scope.flashcards && flashcardKinds.includes(entityKind)) {
        return false
    }
    // gate the standalone coding-problem search index behind its scope flag
    if (!scope.codingProblems && codingProblemKinds.includes(entityKind)) {
        return false
    }
    return true
}

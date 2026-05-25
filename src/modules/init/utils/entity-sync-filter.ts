import type {
    ChallengeEntity,
    ContentEntity,
    LessonVideoEntity,
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

export const shouldSyncLessonVideoEntity = (
    scope: SynchronizerSyncScope,
    lessonVideo: LessonVideoEntity,
): boolean => {
    const courseDisplayId = lessonVideo.content?.module?.course?.displayId
    const moduleOrderIndex = lessonVideo.content?.module?.orderIndex
    if (!courseDisplayId || moduleOrderIndex === undefined) {
        return true
    }
    return shouldIncludeCourseModule(
        scope.moduleIndexFilterByDisplayId,
        courseDisplayId,
        moduleOrderIndex,
    )
}

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

export const shouldSynchronizerSyncEntityKind = (
    scope: SynchronizerSyncScope,
    entityKind: string,
    foundationKinds: Array<string>,
    headhuntingKinds: Array<string>,
): boolean => {
    if (!scope.foundations && foundationKinds.includes(entityKind)) {
        return false
    }
    if (!scope.headhunting && headhuntingKinds.includes(entityKind)) {
        return false
    }
    return true
}

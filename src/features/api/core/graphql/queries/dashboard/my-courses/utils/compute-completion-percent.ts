import {
    MyCourseProgressResult,
} from "@modules/bussiness"

/**
 * Overall course-completion percentage as the equal-weight average of the
 * present progress dimensions (content / challenge / milestone). Each dimension
 * with at least one item (`total > 0`) contributes its own `completed / total`
 * ratio equally, so a course is not dominated by whichever dimension happens to
 * have the most items (e.g. hundreds of challenges vs. a handful of milestones).
 *
 * Shared by the `myCourses` (dashboard) + `userCourses` (public profile) reads,
 * which both project the same {@link MyCourseProgressResult} counts.
 *
 * @param row - one course's progress counts from the projection read.
 * @returns a 0–100 integer; 0 when no dimension has any items yet.
 */
export const computeCompletionPercent = (row: MyCourseProgressResult): number => {
    const ratios: Array<number> = []
    if (row.contentTotal > 0) {
        ratios.push(Math.min(1, row.contentCompleted / row.contentTotal))
    }
    if (row.challengeTotal > 0) {
        ratios.push(Math.min(1, row.challengeCompleted / row.challengeTotal))
    }
    if (row.total > 0) {
        ratios.push(Math.min(1, row.completed / row.total))
    }
    if (ratios.length === 0) {
        return 0
    }
    const sum = ratios.reduce((acc, ratio) => acc + ratio, 0)
    return Math.round((sum / ratios.length) * 100)
}

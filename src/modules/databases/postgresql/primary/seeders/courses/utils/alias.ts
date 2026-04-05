/**
 * Get the alias for a course.
 * @param courseIndex - The index of the course.
 * @returns The alias for the course.
 */
export const courseAlias = (
    courseIndex: number,
) => {
    const map = {
        0: "fullstack-mastery",
        1: "system-design-mastery",
        2: "devops-cloud-mastery",
    }
    return map[courseIndex]
}
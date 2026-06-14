/**
 * Split a whole-number rubric weight across `count` criteria so the parts sum exactly to
 * `totalWeight` (e.g. 30 across 7 → four 5s and three 4s).
 *
 * @param totalWeight - Bucket weight (outcome 30 / approach 70).
 * @param count - Number of criteria in the bucket.
 * @returns Per-criterion integer scores in the same order as the criteria list.
 */
export function splitIntegerWeight(
    totalWeight: number,
    count: number,
): Array<number> {
    if (count <= 0) {
        return []
    }
    const weight = Math.max(0,
        Math.round(totalWeight))
    const base = Math.floor(weight / count)
    const remainder = weight % count
    return Array.from(
        {
            length: count,
        },
        (_, index) => base + (index < remainder ? 1 : 0),
    )
}

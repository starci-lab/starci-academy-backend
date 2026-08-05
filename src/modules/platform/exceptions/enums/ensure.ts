/** Range type when value is not within expected bounds. */
export enum EnsureRangeType {
    /** Value was below the minimum — validation fails on the floor. */
    LowerBound = "lowerBound",
    /** Value exceeded the maximum — validation fails on the ceiling. */
    UpperBound = "upperBound",
    /** Value sat outside an inclusive min–max window. */
    Between = "between",
}

import type {
    Dayjs
} from "dayjs"

/** Params for aligning a time to an interval in UTC. */
export interface AlignTimeToIntervalUtcParams {
    /** IANA time zone used to interpret the time before aligning. */
    timeZone: string
    /** Interval length in milliseconds to align the time down to. */
    intervalMs: number
    /** The Dayjs instance to align. */
    time: Dayjs
}

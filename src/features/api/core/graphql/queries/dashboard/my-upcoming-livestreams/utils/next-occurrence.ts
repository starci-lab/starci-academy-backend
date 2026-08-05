import {
    DayOfWeek,
} from "@modules/databases"

/**
 * Maps a {@link DayOfWeek} to the JavaScript `Date.getDay()` index (0 = Sunday ...
 * 6 = Saturday) so we can advance a date to the right weekday.
 */
const DAY_OF_WEEK_TO_INDEX: Record<DayOfWeek, number> = {
    [DayOfWeek.Sunday]: 0,
    [DayOfWeek.Monday]: 1,
    [DayOfWeek.Tuesday]: 2,
    [DayOfWeek.Wednesday]: 3,
    [DayOfWeek.Thursday]: 4,
    [DayOfWeek.Friday]: 5,
    [DayOfWeek.Saturday]: 6,
}

/** Number of days in a week -- the period a recurring weekly slot rolls over by. */
const DAYS_PER_WEEK = 7

/** Params for computing the next concrete occurrence of a recurring weekly slot. */
export interface NextOccurrenceParams {
    /** Weekday the slot recurs on. */
    dayOfWeek: DayOfWeek
    /** Wall-clock time string ("HH:mm:ss" or "HH:mm") the occurrence starts at. */
    time: string
    /** Reference instant the search starts from (typically `new Date()`). */
    from: Date
}

/**
 * Computes the next concrete instant on or after `from` that falls on the given
 * weekday at the given wall-clock time. Times carry no timezone, so they are
 * interpreted in the server's local time (the same convention the calendar UI
 * assumes); the recurrence rolls over weekly.
 *
 * @param params - The slot's weekday + time and the reference instant.
 * @returns The next occurrence as a concrete `Date`.
 *
 * @example
 * // next Monday 19:30 at or after now
 * nextWeeklyOccurrence({ dayOfWeek: DayOfWeek.Monday, time: "19:30:00", from: new Date() })
 */
export const nextWeeklyOccurrence = ({
    dayOfWeek,
    time,
    from,
}: NextOccurrenceParams): Date => {
    // split the wall-clock string into hours/minutes/seconds (seconds optional)
    const [
        hours,
        minutes,
        seconds = 0,
    ] = time.split(":").map((part) => Number(part))

    // start from the reference day at the slot's wall-clock time
    const candidate = new Date(from)
    candidate.setHours(hours,
        minutes,
        Number(seconds),
        0)

    // how many days forward to reach the target weekday (0..6)
    const targetIndex = DAY_OF_WEEK_TO_INDEX[dayOfWeek]
    const dayDelta = (targetIndex - candidate.getDay() + DAYS_PER_WEEK) % DAYS_PER_WEEK
    // advance to that weekday (still possibly today when dayDelta is 0)
    candidate.setDate(candidate.getDate() + dayDelta)

    // if the computed instant already passed (e.g. the slot is earlier today),
    // roll forward a full week so we always return a future-or-now occurrence
    if (candidate.getTime() < from.getTime()) {
        candidate.setDate(candidate.getDate() + DAYS_PER_WEEK)
    }

    return candidate
}

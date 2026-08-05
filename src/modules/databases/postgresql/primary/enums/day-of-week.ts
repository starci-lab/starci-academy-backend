import {
    createEnumType,
} from "@modules/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/** Day of week for recurring livestream slots (Monday–Sunday). */
export enum DayOfWeek {
    /** Recurring livestream fires every Monday (`Date#getDay()` = 1). */
    Monday = "monday",
    /** Recurring livestream fires every Tuesday (`Date#getDay()` = 2). */
    Tuesday = "tuesday",
    /** Recurring livestream fires every Wednesday (`Date#getDay()` = 3). */
    Wednesday = "wednesday",
    /** Recurring livestream fires every Thursday (`Date#getDay()` = 4). */
    Thursday = "thursday",
    /** Recurring livestream fires every Friday (`Date#getDay()` = 5). */
    Friday = "friday",
    /** Recurring livestream fires every Saturday (`Date#getDay()` = 6). */
    Saturday = "saturday",
    /** Recurring livestream fires every Sunday (`Date#getDay()` = 0 — not 7). */
    Sunday = "sunday",
}

export const GraphQLTypeDayOfWeek = createEnumType(DayOfWeek)

registerEnumType(
    GraphQLTypeDayOfWeek,
    {
        name: "DayOfWeek",
        description: "Day of week for a recurring livestream session.",
        valuesMap: {
            [DayOfWeek.Monday]: {
                description: "Monday.",
            },
            [DayOfWeek.Tuesday]: {
                description: "Tuesday.",
            },
            [DayOfWeek.Wednesday]: {
                description: "Wednesday.",
            },
            [DayOfWeek.Thursday]: {
                description: "Thursday.",
            },
            [DayOfWeek.Friday]: {
                description: "Friday.",
            },
            [DayOfWeek.Saturday]: {
                description: "Saturday.",
            },
            [DayOfWeek.Sunday]: {
                description: "Sunday.",
            },
        },
    },
)

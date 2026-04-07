import {
    createEnumType,
} from "@modules/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/** Day of week for recurring livestream slots (Monday–Sunday). */
export enum DayOfWeek {
    Monday = "monday",
    Tuesday = "tuesday",
    Wednesday = "wednesday",
    Thursday = "thursday",
    Friday = "friday",
    Saturday = "saturday",
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

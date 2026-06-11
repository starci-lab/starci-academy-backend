import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/common"
import {
    InterviewVerdict,
} from "@modules/bussiness"

/**
 * GraphQL wrapper for the bussiness {@link InterviewVerdict} enum so the result
 * type can expose the verdict band. The bussiness enum stays the single source
 * of truth; this only registers it with the GraphQL schema.
 */
export const GraphQLTypeInterviewVerdict = createEnumType(
    InterviewVerdict,
)

registerEnumType(
    GraphQLTypeInterviewVerdict,
    {
        name: "InterviewVerdict",
        description: "Coarse pass/borderline/fail band for a graded interview answer.",
        valuesMap: {
            [InterviewVerdict.Pass]: {
                description: "Answer is solid for the card's level — clear hire signal.",
            },
            [InterviewVerdict.Borderline]: {
                description: "Answer is partial — some substance, notable gaps.",
            },
            [InterviewVerdict.Fail]: {
                description: "Answer misses the point or is largely wrong for the level.",
            },
        },
    },
)

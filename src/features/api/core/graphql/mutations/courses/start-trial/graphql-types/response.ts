import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "Resulting enrollment flag after starting a trial.",
})
/** Payload after starting (or idempotently resolving) a trial enrollment. */
export class StartTrialResponseData {
    @Field(
        () => Boolean,
        {
            description: "True when the user is already a real (paid) enrollee; false for a fresh trial placeholder.",
        },
    )
        isEnrolled: boolean
}

@ObjectType({
    description: "Response wrapper for the start-trial mutation.",
})
/** GraphQL envelope returning whether the user is already paid-enrolled, so the client does not treat an existing purchase as a fresh trial. */
export class StartTrialResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<StartTrialResponseData>
{
    @Field(
        () => StartTrialResponseData,
        {
            nullable: true,
        },
    )
        data: StartTrialResponseData
}

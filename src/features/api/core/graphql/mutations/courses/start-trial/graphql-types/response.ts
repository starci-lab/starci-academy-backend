import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** Payload after starting (or idempotently resolving) a trial enrollment. */
@ObjectType({
    description: "Resulting enrollment flag after starting a trial.",
})
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

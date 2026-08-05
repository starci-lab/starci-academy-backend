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
    description: "Result of requesting to join a course's GitHub team.",
})
/**
 * Invite outcome: `requested` plus optional `jobId` so the client can
 * subscribe to job notifications instead of polling GitHub membership.
 */
export class RequestToTeamData {
    @Field(
        () => Boolean,
        {
            description: "True when the team-invite job was enqueued (membership becomes 'pending').",
        },
    )
        requested: boolean

    @Field(
        () => String,
        {
            nullable: true,
            description: "Id of the enqueued resolve-github job — subscribe to /job_notifications room job:<id> for realtime status.",
        },
    )
        jobId?: string
}

@ObjectType({
    description: "Response wrapper for the requestToTeam mutation.",
})
/**
 * Envelope for requestToTeam. `data` is nullable so interceptor error
 * paths do not crash GraphQL over a missing invite payload.
 */
export class RequestToTeamResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<RequestToTeamData>
{
    @Field(
        () => RequestToTeamData,
        {
            nullable: true,
            description: "Request-to-team payload.",
        },
    )
        data: RequestToTeamData
}

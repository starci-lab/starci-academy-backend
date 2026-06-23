import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Result of requesting to join a course's GitHub team.",
})
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

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
    description: "GitHub team membership state for one enrolled course.",
})
/**
 * One enrolled course's GitHub team mapping -- used to decide whether the
 * viewer still needs an invite / join modal for that course.
 */
export class GithubTeamEntryData {
    @Field(
        () => String,
        {
            description: "Enrolled course id.",
        },
    )
        courseId: string

    @Field(
        () => String,
        {
            description: "Course display id / slug.",
        },
    )
        courseSlug: string

    @Field(
        () => String,
        {
            description: "Course title.",
        },
    )
        courseTitle: string

    @Field(
        () => String,
        {
            description: "GitHub team slug mapped to this course.",
        },
    )
        teamSlug: string

    @Field(
        () => String,
        {
            description: "Membership state: 'active' (in team) | 'pending' (invited) | 'none' (not invited).",
        },
    )
        state: string
}

@ObjectType({
    description: "The viewer's GitHub link + per-course team membership status.",
})
/**
 * Viewer's GitHub link state plus every required course-team membership --
 * `allInTeam` tells the client it can skip the blocking join modal.
 */
export class MyGithubTeamStatusData {
    @Field(
        () => Boolean,
        {
            description: "Whether the viewer has linked a GitHub identity (githubUsername set).",
        },
    )
        linked: boolean

    @Field(
        () => String,
        {
            nullable: true,
            description: "The linked GitHub username, when linked.",
        },
    )
        githubUsername: string | null

    @Field(
        () => [GithubTeamEntryData],
        {
            description: "One entry per enrolled course that maps to a GitHub team.",
        },
    )
        teams: Array<GithubTeamEntryData>

    @Field(
        () => Boolean,
        {
            description: "True when every required course team is joined (state active) — no blocking modal needed.",
        },
    )
        allInTeam: boolean
}

@ObjectType({
    description: "Response wrapper for the myGithubTeamStatus query.",
})
/** GraphQL envelope for the `myGithubTeamStatus` query. */
export class MyGithubTeamStatusResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyGithubTeamStatusData>
{
    @Field(
        () => MyGithubTeamStatusData,
        {
            nullable: true,
            description: "GitHub team status payload.",
        },
    )
        data: MyGithubTeamStatusData
}

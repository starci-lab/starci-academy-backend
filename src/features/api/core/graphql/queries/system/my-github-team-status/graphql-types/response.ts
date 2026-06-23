import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "GitHub team membership state for one enrolled course.",
})
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

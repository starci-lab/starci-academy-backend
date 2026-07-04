import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** One verified track (a course the learner has built AI-graded proof in). */
@ObjectType({
    description: "A verified per-course competency track on a learner's profile.",
})
export class JobReadinessTrackItem {
    @Field(
        () => String,
        {
            description: "Course title, for the badge label.",
        },
    )
        courseTitle: string

    @Field(
        () => String,
        {
            description: "Course URL slug (display id), so the badge can link to the course.",
        },
    )
        courseSlug: string

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Capstone completion % (0–100) for this course — null when the course has no capstone tasks.",
        },
    )
        capstoneScore: number | null

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Average mock-interview overall score (0–100) for this course — null when no attempts.",
        },
    )
        interviewScore: number | null

    @Field(
        () => Int,
        {
            description: "Domain competency depth (0–100): weighted(capstone, interview).",
        },
    )
        depthScore: number
}

/** Composite job-readiness portfolio for one learner. */
@ObjectType({
    description: "Composite job-readiness score + verified-track portfolio + global foundation.",
})
export class JobReadinessData {
    @Field(
        () => Int,
        {
            description: "0–100 composite — strongest track leads + foundation blend + breadth bonus.",
        },
    )
        compositeScore: number

    @Field(
        () => String,
        {
            description: "Coarse readiness band (\"needsWork\" | \"building\" | \"jobReady\").",
        },
    )
        band: string

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Latest CV review score (0–100), global — null if no CV reviewed yet.",
        },
    )
        cvScore: number | null

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Challenge-strength percentile (0–100), global — null if no passed challenges.",
        },
    )
        challengeScore: number | null

    @Field(
        () => [JobReadinessTrackItem],
        {
            description: "Verified tracks (one per paid enrollment), strongest depth first.",
        },
    )
        tracks: Array<JobReadinessTrackItem>
}

@ObjectType({
    description: "Response wrapper for the job-readiness queries.",
})
export class JobReadinessResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<JobReadinessData>
{
    @Field(
        () => JobReadinessData,
        {
            nullable: true,
            description: "The learner's job-readiness portfolio.",
        },
    )
        data: JobReadinessData
}

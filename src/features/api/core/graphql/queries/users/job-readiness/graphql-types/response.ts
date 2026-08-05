import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "A verified per-course competency track on a learner's profile.",
})
/** One verified track (a course the learner has built AI-graded proof in). */
export class JobReadinessTrackItem {
    @Field(
        () => ID,
        {
            description: "Stable id of the course this track is built on — used as the row key + to resolve the course.",
        },
    )
        courseId: string

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
            nullable: true,
            description: "Best unified-CV score (0–100) tied to this course — null when no scored CV is attached to it.",
        },
    )
        cvScore: number | null

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Domain competency depth (0–100): weighted avg over present pillars only — null when every pillar is null.",
        },
    )
        depthScore: number | null

    @Field(
        () => String,
        {
            description: "Coarse readiness band for this track (\"needsWork\" | \"building\" | \"jobReady\").",
        },
    )
        band: string

    @Field(
        () => Boolean,
        {
            description: "Whether this track clears the qualified-depth floor — a badge flag only.",
        },
    )
        isQualified: boolean
}

@ObjectType({
    description: "Global foundation signals — one per learner regardless of course count.",
})
/** The global, person-level foundation signals (not scoped to any course). */
export class JobReadinessFoundationData {
    @Field(
        () => Int,
        {
            nullable: true,
            description: "Challenge-strength percentile (0–100), global — null if no passed challenges.",
        },
    )
        codingPercentile: number | null

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Best CV score (0–100) across all the learner's CVs (unified + legacy, unioned during migration) — null if no CV scored yet.",
        },
    )
        cvScore: number | null
}

@ObjectType({
    description: "Job-readiness portfolio — a global foundation plus independent per-track competency cards.",
})
/** Job-readiness portfolio for one learner -- per-track cards + global foundation, no blended composite. */
export class JobReadinessData {
    @Field(
        () => JobReadinessFoundationData,
        {
            description: "Global, person-level foundation signals (coding percentile + best CV).",
        },
    )
        foundation: JobReadinessFoundationData

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
/**
 * GraphQL envelope for job-readiness reads. `data` is null only on the error
 * path; a learner with no tracks still returns an empty `tracks` array plus
 * the global foundation block.
 */
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

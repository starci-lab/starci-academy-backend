import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    CvVerificationLevel,
    GraphQLTypeCvVerificationLevel,
    UserEntity,
} from "@modules/databases"
import {
    JobReadinessTrackItem,
} from "../../job-readiness/graphql-types"

@ObjectType({
    description: "A recruiter-marketplace candidate ranked within a single filtered track.",
})
/**
 * One ranked candidate on the recruiter marketplace — the open-to-work user plus
 * their readiness card for the ONE filtered track. The `track` is a
 * {@link JobReadinessTrackItem} (reused verbatim, not re-declared) so the FE can
 * show the same `band` / `isQualified` badges it shows on a profile — a
 * qualitative signal, never a raw cross-track composite number.
 */
export class TalentCandidateItem {
    @Field(
        () => UserEntity,
        {
            description: "The open-to-work candidate — public header fields render the card, links to /profile/<username>.",
        },
    )
        user: UserEntity

    @Field(
        () => JobReadinessTrackItem,
        {
            description: "The candidate's readiness card for the filtered track ONLY (depthScore/band/isQualified for that one course).",
        },
    )
        track: JobReadinessTrackItem

    @Field(
        () => GraphQLTypeCvVerificationLevel,
        {
            description: "How strongly the candidate's readiness is backed by graded StarCi work (self-reported vs activity-backed vs capstone-verified) — a recruiter trust badge.",
        },
    )
        verificationLevel: CvVerificationLevel
}

@ObjectType({
    description: "Response wrapper for the talentCandidates query.",
})
/**
 * Response wrapper for the `talentCandidates` query — a page of open-to-work
 * candidates for ONE track, ranked by that track's `depthScore` DESC (never a
 * blended cross-track score).
 */
export class TalentCandidatesResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<TalentCandidateItem>> {
    @Field(
        () => [TalentCandidateItem],
        {
            nullable: true,
            description: "Candidates for the filtered track, ranked by that track's depthScore (strongest first).",
        },
    )
        data: Array<TalentCandidateItem>
}

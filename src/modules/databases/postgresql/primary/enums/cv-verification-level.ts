import {
    createEnumType,
} from "@modules/lib/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * How strongly a candidate's readiness is backed by REAL, graded StarCi work --
 * a recruiter trust signal, tied to activity (not payment). Uploading a polished
 * CV proves nothing on its own; passing a StarCi capstone / getting challenge
 * work AI-graded does. Used to badge candidates and as a secondary marketplace
 * rank key (verified candidates surface above self-reported ones at equal depth).
 *
 * Deliberately count-independent and payment-independent (fair-monetization
 * axiom): the level reflects WHAT the user has done at StarCi, never how many
 * CVs they have or whether they paid.
 */
export enum CvVerificationLevel {
    /**
     * No graded StarCi work behind the CV -- e.g. an externally-strong developer
     * who only uploaded their own CV file. Their readiness rests on self-reported
     * claims a recruiter cannot verify through StarCi.
     */
    SelfReported = "self_reported",
    /**
     * Has AI-graded StarCi work (>=1 challenge submission that was scored) but has
     * not passed a capstone yet -- hands-on engagement StarCi can vouch for.
     */
    ActivityBacked = "activity_backed",
    /**
     * Has passed >=1 StarCi capstone / milestone task -- the strongest proof:
     * real project work completed and graded to a pass. The signal recruiters
     * weight most.
     */
    CapstoneVerified = "capstone_verified",
}

/** GraphQL enum type for {@link CvVerificationLevel}. */
export const GraphQLTypeCvVerificationLevel = createEnumType(CvVerificationLevel)

registerEnumType(
    GraphQLTypeCvVerificationLevel,
    {
        name: "CvVerificationLevel",
        description: "How strongly a candidate's readiness is backed by graded StarCi work (recruiter trust tier).",
        valuesMap: {
            [CvVerificationLevel.SelfReported]: {
                description: "No graded StarCi work — the CV rests on self-reported claims only.",
            },
            [CvVerificationLevel.ActivityBacked]: {
                description: "Has AI-graded StarCi challenge work, but no passed capstone yet.",
            },
            [CvVerificationLevel.CapstoneVerified]: {
                description: "Has passed a StarCi capstone/milestone task — the strongest proof of real project work.",
            },
        },
    },
)

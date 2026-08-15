import {
    createEnumType,
} from "@modules/lib/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/** Strength of the immutable StarCi evidence selected into one CV run. */
export enum CvEvidenceLevel {
    /** The run contains no selected StarCi-verified capstone evidence. */
    SelfReported = "self_reported",
    /** The run contains at least one selected passed StarCi capstone. */
    CapstoneVerified = "capstone_verified",
}

export const GraphQLTypeCvEvidenceLevel = createEnumType(CvEvidenceLevel)

registerEnumType(
    GraphQLTypeCvEvidenceLevel,
    {
        name: "CvEvidenceLevel",
        description: "Whether this CV run contains an explicitly selected, passed StarCi capstone.",
    },
)

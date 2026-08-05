import {
    Field,
    Float,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Challenge-related tuning from mounted `app.json` (`systemConfig.challenge`).",
})
/** Mounted challenge pass threshold the FE uses to explain grading outcomes. */
export class SystemConfigChallenge {
    @Field(
        () => Float,
        {
            description: "Minimum score (0-1) required to pass a challenge.",
        },
    )
        passThreshold: number
}

@ObjectType({
    description: "Task-related tuning from mounted `app.json` (`systemConfig.task`).",
})
/** Mounted personal-project task pass threshold mirrored to the client. */
export class SystemConfigTask {
    @Field(
        () => Float,
        {
            description: "Minimum score (0-1) required to pass a personal project task.",
        },
    )
        passThreshold: number
}

@ObjectType({
    description: "Free Auto-lane caps from `systemConfig.ai.auto` in mounted `app.yaml`.",
})
/**
 * Free Auto-lane quota numbers (5h / week windows + per-grade cost) so the
 * client can render remaining-credit UI without a second round-trip.
 */
export class SystemConfigAiAuto {
    @Field(
        () => Int,
        {
            description: "Max Auto credits per rolling 5-hour window.",
        },
    )
        creditsPer5h: number

    @Field(
        () => Int,
        {
            description: "Max Auto credits per rolling 7-day window.",
        },
    )
        creditsPerWeek: number

    @Field(
        () => Int,
        {
            description: "Credits charged per Auto grading.",
        },
    )
        creditCost: number
}

@ObjectType({
    description: "AI quota section from mounted `systemConfig.ai`.",
})
/** AI section of mounted system config — currently just the free Auto lane. */
export class SystemConfigAi {
    @Field(
        () => SystemConfigAiAuto,
        {
            description: "Free Auto lane caps (resolved from app.yaml + defaults).",
        },
    )
        auto: SystemConfigAiAuto
}

@ObjectType({
    description: "Payload matching `systemConfig` in `.mount/config/app.json`.",
})
/**
 * Public subset of mounted `systemConfig` — pass thresholds plus Auto-lane
 * quota caps the client needs without reading the mount filesystem itself.
 */
export class SystemConfigData {
    @Field(
        () => SystemConfigChallenge,
        {
            description: "Challenge thresholds and limits.",
        },
    )
        challenge: SystemConfigChallenge

    @Field(
        () => SystemConfigTask,
        {
            description: "Personal project task thresholds and limits.",
        },
    )
        task: SystemConfigTask

    @Field(
        () => SystemConfigAi,
        {
            description: "AI quota caps (Auto lane from `systemConfig.ai.auto`).",
        },
    )
        ai: SystemConfigAi
}

@ObjectType({
    description: "Response wrapper for mounted system config.",
})
/** GraphQL envelope for the public `systemConfig` query. */
export class SystemConfigResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<SystemConfigData>
{
    @Field(
        () => SystemConfigData,
        {
            nullable: true,
            description: "Mounted `systemConfig` subset (challenge only).",
        },
    )
        data: SystemConfigData
}

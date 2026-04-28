import {
    Field,
    Float,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Challenge-related tuning from mounted `app.json` (`systemConfig.challenge`).",
})
export class SystemConfigChallenge {
    @Field(
        () => Float,
        {
            description: "Minimum score (0–1) required to pass a challenge.",
        },
    )
        passThreshold: number
}

@ObjectType({
    description: "Payload matching `systemConfig` in `.mount/config/app.json`.",
})
export class SystemConfigData {
    @Field(
        () => SystemConfigChallenge,
        {
            description: "Challenge thresholds and limits.",
        },
    )
        challenge: SystemConfigChallenge
}

@ObjectType({
    description: "Response wrapper for mounted system config.",
})
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

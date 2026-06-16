import {
    Args,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    InjectPrimaryPostgreSQLEntityManager,
    KpiKey,
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    SetKpiTargetRequest,
    SetKpiTargetResponse,
} from "./graphql-types"

/** Per-KPI upper bound for a sane target (so a progress ring never goes absurd). */
const MAX_TARGET: Record<KpiKey, number> = {
    [KpiKey.Lessons]: 100,
    [KpiKey.StudyDays]: 7,
    [KpiKey.Challenges]: 100,
    [KpiKey.Coding]: 100,
    [KpiKey.Flashcards]: 1000,
}

/**
 * Set one of the authenticated user's weekly KPI targets.
 *
 * The value is clamped into `[0, MAX_TARGET[key]]` (0 clears that KPI's goal),
 * then merged into the user's `weekly_kpi_targets` jsonb map via an atomic
 * `jsonb_set` so concurrent writes to different keys don't clobber each other.
 */
@Resolver()
export class SetKpiTargetResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "KPI target updated successfully",
        [Locale.Vi]: "Cập nhật mục tiêu KPI thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SetKpiTargetResponse,
        {
            name: "setKpiTarget",
            description: "Set one of the current user's weekly KPI targets.",
        },
    )
    async execute(
        @Args("request")
            request: SetKpiTargetRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<SetKpiTargetResponse> {
        // clamp into [0, per-KPI max] so the stored target is always sane
        const target = Math.min(
            Math.max(Math.trunc(request.target),
                0),
            MAX_TARGET[request.key],
        )
        // atomic merge of the single key into the jsonb map (other keys untouched)
        await this.entityManager.query(
            `
            UPDATE users
            SET weekly_kpi_targets = jsonb_set(
                COALESCE(weekly_kpi_targets, '{}'::jsonb),
                $2,
                to_jsonb($3::int),
                true
            )
            WHERE id = $1
            `,
            [
                user.id,
                `{${request.key}}`,
                target,
            ],
        )
        // no payload — the client already knows the value it sent (post-clamp it can
        // re-fetch via myKpis if it needs the canonical number)
        return {
        } as SetKpiTargetResponse
    }
}

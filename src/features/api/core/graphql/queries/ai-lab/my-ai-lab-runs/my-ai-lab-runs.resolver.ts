import {
    Args,
    ID,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    AiLabRunEntity,
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    AiLabPlaygroundService,
} from "@modules/bussiness"
import {
    MyAiLabRunsResponse,
} from "./graphql-types"

/**
 * Lists the authenticated learner's prior runs within a single AI Lab
 * playground, newest first. Drives the run-history panel so the learner can
 * revisit (and replay from cache) earlier prompts.
 */
@Resolver()
export class MyAiLabRunsResolver {
    constructor(
        private readonly aiLabPlaygroundService: AiLabPlaygroundService,
    ) { }

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "AI Lab runs fetched successfully",
        [Locale.Vi]: "Lấy lịch sử chạy phòng thí nghiệm AI thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyAiLabRunsResponse,
        {
            name: "myAiLabRuns",
            description: "Lists the authenticated learner's runs within a playground, newest first.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "playgroundId",
            {
                type: () => ID,
            },
        )
            playgroundId: string,
    ): Promise<Array<AiLabRunEntity>> {
        // scope the run history to the authenticated learner + the requested playground
        const {
            runs,
        } = await this.aiLabPlaygroundService.listMyRuns({
            userId: user.id,
            playgroundId,
        })
        return runs
    }
}

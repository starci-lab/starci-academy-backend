import {
    Args,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLLocale,
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
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    RunPlaygroundPromptInput,
    RunPlaygroundPromptResponse,
} from "./graphql-types"
import {
    RunPlaygroundPromptService,
} from "./run-playground-prompt.service"
import type {
    RunPlaygroundPromptResult,
} from "./types"

/**
 * GraphQL entry: create an AI Lab playground run. On a cache hit the stored
 * output is returned inline; otherwise a `Streaming` run id is returned and the
 * FE subscribes to the token stream over the AI Lab Socket.IO namespace. The
 * stream itself is driven by the gateway (Realtime phase), not this mutation.
 */
@Resolver()
export class RunPlaygroundPromptResolver {
    constructor(
        private readonly runPlaygroundPromptService: RunPlaygroundPromptService,
    ) { }

    @UseThrottler(ThrottlerConfig.Medium)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Playground run created",
        [Locale.Vi]: "Đã tạo phiên chạy phòng thí nghiệm AI",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => RunPlaygroundPromptResponse,
        {
            name: "runPlaygroundPrompt",
            description: "Create an AI Lab playground run; returns a run id the FE streams over Socket.IO (or a cached output on a hit).",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "input",
            {
                description: "Playground, prompts, sampling params, and AI lane selection.",
            },
        )
            input: RunPlaygroundPromptInput,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<RunPlaygroundPromptResult> {
        return this.runPlaygroundPromptService.execute({
            input,
            userId: user.id,
            locale,
        })
    }
}

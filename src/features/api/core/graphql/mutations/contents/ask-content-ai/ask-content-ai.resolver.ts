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
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    AskContentAiRequest,
    AskContentAiResponse,
} from "./graphql-types"
import {
    AskContentAiService,
} from "./ask-content-ai.service"

@Resolver()
/** GraphQL boundary that throttles and authenticates before charging the unified AI credit pool. */
export class AskContentAiResolver {
    constructor(
        private readonly askContentAiService: AskContentAiService,
    ) { }

    /**
     * Ask StarCi AI a question grounded in one content's body. Charges the unified
     * AI credit pool; requires authentication.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Answer generated successfully",
        [Locale.Vi]: "Đã trả lời thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => AskContentAiResponse,
        {
            name: "askContentAi",
            description: "Ask StarCi AI a question grounded in a content's body.",
        },
    )
    async execute(
        @Args("request")
            request: AskContentAiRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.askContentAiService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}

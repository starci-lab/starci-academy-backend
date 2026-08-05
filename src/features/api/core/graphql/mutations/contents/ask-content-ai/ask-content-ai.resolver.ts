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
} from "@modules/api/apollo/server/decorators/locale.decorators"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    AskContentAiRequest,
} from "./graphql-types/request"
import {
    AskContentAiResponse,
} from "./graphql-types/response"
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

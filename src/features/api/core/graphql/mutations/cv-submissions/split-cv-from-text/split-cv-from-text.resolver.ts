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
    SplitCvFromTextRequest,
} from "./graphql-types/request"
import {
    SplitCvFromTextResponse,
} from "./graphql-types/response"
import {
    SplitCvFromTextService,
} from "./split-cv-from-text.service"

@Resolver()
/** GraphQL entry that authenticates before parsing pasted CV text. */
export class SplitCvFromTextResolver {
    constructor(
        private readonly splitCvFromTextService: SplitCvFromTextService,
    ) { }

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "CV parsed into blocks successfully",
        [Locale.Vi]: "Tách CV thành các khối thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SplitCvFromTextResponse,
        {
            name: "splitCvFromText",
            description: "Parse a raw pasted CV / free text into ordered block-editor blocks (no persistence).",
        },
    )
    async execute(
        @Args("request")
            request: SplitCvFromTextRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.splitCvFromTextService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}

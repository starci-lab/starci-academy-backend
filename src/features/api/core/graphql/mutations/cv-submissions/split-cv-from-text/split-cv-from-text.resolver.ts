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
    SplitCvFromTextRequest,
    SplitCvFromTextResponse,
} from "./graphql-types"
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

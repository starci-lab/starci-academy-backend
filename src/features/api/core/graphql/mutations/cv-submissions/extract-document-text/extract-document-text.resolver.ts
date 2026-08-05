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
    ExtractDocumentTextRequest,
} from "./graphql-types/request"
import {
    ExtractDocumentTextResponse,
} from "./graphql-types/response"
import {
    ExtractDocumentTextService,
} from "./extract-document-text.service"

@Resolver()
/** GraphQL entry that authenticates before running extraction into the paste field. */
export class ExtractDocumentTextResolver {
    constructor(
        private readonly extractDocumentTextService: ExtractDocumentTextService,
    ) { }

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Document text extracted successfully",
        [Locale.Vi]: "Trích xuất văn bản tài liệu thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => ExtractDocumentTextResponse,
        {
            name: "extractDocumentText",
            description: "Extract plain text from an uploaded document (CV / job description) by its storage key (no persistence).",
        },
    )
    async execute(
        @Args("request")
            request: ExtractDocumentTextRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.extractDocumentTextService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}

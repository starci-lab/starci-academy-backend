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
    ExtractDocumentTextRequest,
    ExtractDocumentTextResponse,
} from "./graphql-types"
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
        [Locale.Vi]: "Trích xuất văn bản tài liệu thành công",
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

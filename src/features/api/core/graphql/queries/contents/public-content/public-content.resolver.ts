import {
    Args,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
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
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    PublicContentRequest,
} from "./graphql-types/request"
import {
    PublicContentResponse,
} from "./graphql-types/response"
import {
    PublicContentService,
} from "./public-content.service"

@Resolver(() => ContentEntity)
/**
 * GraphQL surface for `publicContent` -- no Keycloak guard; premium content is
 * refused in the handler so this stays safe for anonymous clients.
 */
export class PublicContentResolver {
    constructor(
        private readonly publicContentService: PublicContentService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Public content fetched successfully",
        [Locale.Vi]: "Lấy nội dung công khai thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => PublicContentResponse,
        {
            name: "publicContent",
            description: "Returns a single non-premium content row by id. No authentication required.",
        },
    )
    async execute(
        @Args("request")
            request: PublicContentRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<ContentEntity> {
        return this.publicContentService.execute({
            request,
            locale,
        })
    }
}

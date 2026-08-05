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
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    FoundationCategoriesService,
} from "./foundation-categories.service"
import {
    FoundationCategoriesRequest,
} from "./graphql-types/request"
import {
    FoundationCategoriesPayload,
    FoundationCategoriesResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Public GraphQL entry for `foundationCategories` -- paginated + searchable
 * category browse for the foundations catalog.
 */
export class FoundationCategoriesResolver {
    constructor(
        private readonly foundationCategoriesService: FoundationCategoriesService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseInterceptors(GraphQLTransformInterceptor)
    @GraphQLSuccessMessage({
        [Locale.Vi]: "Lấy danh sách nền tảng thành công", // vn-ok: vi-locale string emitted to clients
        [Locale.En]: "Foundation categories fetched successfully",
    })
    @Query(
        () => FoundationCategoriesResponse,
        {
            name: "foundationCategories",
            description: "List foundation categories (paginated + searchable).",
        },
    )
    async foundationCategories(
        @GraphQLLocale()
            locale: Locale,
        @Args(
            "request",
            {
                nullable: true,
            },
        )
            request?: FoundationCategoriesRequest,
    ): Promise<FoundationCategoriesPayload> {
        return this.foundationCategoriesService.query(locale,
            request)
    }
}

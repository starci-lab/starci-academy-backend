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
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
} from "@modules/databases"
import {
    FoundationCategoriesService,
} from "./foundation-categories.service"
import {
    FoundationCategoriesPayload,
    FoundationCategoriesRequest,
    FoundationCategoriesResponse,
} from "./graphql-types"

@Resolver()
/**
 * Public GraphQL entry for `foundationCategories` — paginated + searchable
 * category browse for the foundations catalog.
 */
export class FoundationCategoriesResolver {
    constructor(
        private readonly foundationCategoriesService: FoundationCategoriesService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseInterceptors(GraphQLTransformInterceptor)
    @GraphQLSuccessMessage({
        [Locale.Vi]: "Lấy danh sách nền tảng thành công",
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

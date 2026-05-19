import {
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
    FoundationCategoryEntity,
    Locale,
} from "@modules/databases"
import {
    FoundationCategoriesService,
} from "./foundation-categories.service"
import {
    FoundationCategoriesResponse,
} from "./graphql-types"

@Resolver()
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
            description: "List all foundation categories.",
        },
    )
    async foundationCategories(
        @GraphQLLocale()
            locale: Locale,
    ): Promise<Array<FoundationCategoryEntity>> {
        return this.foundationCategoriesService.query(locale)
    }
}

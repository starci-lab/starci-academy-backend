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
    ContentEntity,
    Locale,
} from "@modules/databases"
import {
    PublicContentRequest,
    PublicContentResponse,
} from "./graphql-types"
import {
    PublicContentService,
} from "./public-content.service"

@Resolver(() => ContentEntity)
export class PublicContentResolver {
    constructor(
        private readonly publicContentService: PublicContentService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Public content fetched successfully",
        [Locale.Vi]: "Lấy nội dung công khai thành công",
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

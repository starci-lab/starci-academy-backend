import {
    Args,
    Query,
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
} from "@modules/databases"
import {
    ContentsRequest,
    ContentsResponse,
    ContentsResponseData,
} from "./graphql-types"
import {
    ContentsService,
} from "./contents.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"

@Resolver()
export class ContentsResolver {
    constructor(
        private readonly contentsService: ContentsService,
    ) {}

    /**
     * Lists contents for a module with page-based pagination.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Contents fetched successfully",
        [Locale.Vi]: "Lấy danh sách nội dung thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => ContentsResponse,
        {
            name: "contents",
            description: "Lists contents for a module with page-based pagination.",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Module id, pagination, and sort request.",
            },
        )
            request: ContentsRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<ContentsResponseData> {
        return this.contentsService.execute(
            {
                request,
                locale,
            },
        )
    }
}

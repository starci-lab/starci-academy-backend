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
    CheckEmailExistsRequest,
    CheckEmailExistsResponse,
    type CheckEmailExistsData,
} from "./graphql-types"
import {
    CheckEmailExistsService,
} from "./check-email-exists.service"

@Resolver()
export class CheckEmailExistsResolver {
    constructor(
        private readonly checkEmailExistsService: CheckEmailExistsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Email existence checked successfully",
        [Locale.Vi]: "Kiểm tra email tồn tại thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => CheckEmailExistsResponse,
        {
            name: "checkEmailExists",
            description: "Checks whether an email may exist using a bloom filter (may contain false positives).",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Email to check.",
            },
        )
            request: CheckEmailExistsRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<CheckEmailExistsData> {
        return this.checkEmailExistsService.execute(
            {
                request,
                locale,
            },
        )
    }
}


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
    CheckEmailExistsRequest,
} from "./graphql-types/request"
import {
    CheckEmailExistsResponse,
    type CheckEmailExistsData,
} from "./graphql-types/response"
import {
    CheckEmailExistsService,
} from "./check-email-exists.service"

@Resolver()
/**
 * Public `checkEmailExists` query -- bloom-filter probe with possible false
 * positives. Unauthenticated on purpose so the signup form can call it
 * before the user has a token.
 */
export class CheckEmailExistsResolver {
    constructor(
        private readonly checkEmailExistsService: CheckEmailExistsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Email existence checked successfully",
        [Locale.Vi]: "Kiểm tra email tồn tại thành công", // vn-ok: vi-locale string emitted to clients
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


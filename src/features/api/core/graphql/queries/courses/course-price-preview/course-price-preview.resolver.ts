import {
    Args,
    ID,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    CoursePricePreviewData,
    CoursePricePreviewResponse,
} from "./graphql-types"
import {
    CoursePricePreviewService,
} from "./course-price-preview.service"

@Resolver()
/**
 * Pre-checkout course price preview: the original vs loyalty-discounted price the
 * viewer would be charged for a course, computed with the exact checkout pricing.
 * Drives the payment modal's order summary (what + how much + why discounted).
 */
export class CoursePricePreviewResolver {
    constructor(
        private readonly coursePricePreviewService: CoursePricePreviewService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Course price preview fetched successfully",
        [Locale.Vi]: "Lấy giá khóa học thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => CoursePricePreviewResponse,
        {
            name: "coursePricePreview",
            description: "The viewer's pre-checkout price for a course (with the loyalty discount).",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "courseId",
            {
                type: () => ID,
                description: "Course id to price.",
            },
        )
            courseId: string,
        @Args(
            "voucherCode",
            {
                type: () => String,
                nullable: true,
                description: "Optional Coin-shop voucher code to preview on top of the loyalty discount.",
            },
        )
            voucherCode?: string,
    ): Promise<CoursePricePreviewData> {
        return this.coursePricePreviewService.preview({
            userId: user.id,
            courseId,
            voucherCode,
        })
    }
}

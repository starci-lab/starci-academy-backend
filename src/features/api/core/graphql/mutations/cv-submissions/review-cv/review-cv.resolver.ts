import {
    GraphQLLocale,
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    Args,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import {
    ReviewCvRequest,
    ReviewCvResponse,
    ReviewCvResponseData,
} from "./graphql-types"
import {
    ReviewCvService,
} from "./review-cv.service"

@Resolver()
export class ReviewCvResolver {
    constructor(
        private readonly reviewCvService: ReviewCvService,
    ) {}

    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @GraphQLSuccessMessage({
        [Locale.En]: "CV review queued successfully",
        [Locale.Vi]: "Đã xếp hàng đánh giá CV thành công",
    })
    @Mutation(
        () => ReviewCvResponse,
        {
            name: "reviewCv",
            description: "Queue CV processing for a specific rubric level (template).",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "CV submission and rubric template to use.",
            },
        )
            request: ReviewCvRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<ReviewCvResponseData> {
        return this.reviewCvService.execute({
            user,
            request,
            locale,
        })
    }
}

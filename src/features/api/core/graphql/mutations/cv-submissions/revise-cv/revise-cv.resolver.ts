import {
    Args,
    Mutation,
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
    UserEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    ReviseCvRequest,
    ReviseCvResponse,
} from "./graphql-types"
import {
    ReviseCvService,
} from "./revise-cv.service"

@Resolver()
export class ReviseCvResolver {
    constructor(
        private readonly reviseCvService: ReviseCvService,
    ) { }

    /**
     * Revise an existing uploaded CV submission using the learner's free-text
     * notes. Validates the source submission exists + belongs to the caller,
     * then creates a `Pending` cv_generations run and enqueues the background
     * revise job (mode = Revise); requires authentication. Poll
     * `cvGeneration(id)` for status + result.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "CV revision started successfully",
        [Locale.Vi]: "Đã bắt đầu chỉnh sửa CV thành công",
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => ReviseCvResponse,
        {
            name: "reviseCv",
            description: "Revise an existing CV submission using the learner's free-text prompts.",
        },
    )
    async execute(
        @Args("request")
            request: ReviseCvRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.reviseCvService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}

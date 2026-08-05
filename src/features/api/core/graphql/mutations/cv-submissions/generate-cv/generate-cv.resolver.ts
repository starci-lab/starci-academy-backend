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
    GenerateCvRequest,
    GenerateCvResponse,
} from "./graphql-types"
import {
    GenerateCvService,
} from "./generate-cv.service"

@Resolver()
/** GraphQL entry that authenticates before enqueueing CV generation. */
export class GenerateCvResolver {
    constructor(
        private readonly generateCvService: GenerateCvService,
    ) { }

    /**
     * Build a brand-new CV from the learner's free-text prompts. Creates a
     * `Pending` cv_generations run and enqueues the background build job
     * (mode = Generate); requires authentication. Poll `cvGeneration(id)` for
     * status + result.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "CV generation started successfully",
        [Locale.Vi]: "Đã bắt đầu tạo CV thành công",
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => GenerateCvResponse,
        {
            name: "generateCv",
            description: "Build a brand-new CV from the learner's free-text prompts.",
        },
    )
    async execute(
        @Args("request")
            request: GenerateCvRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.generateCvService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}

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
    UploadCvRequest,
    UploadCvResponse,
} from "./graphql-types"
import {
    UploadCvService,
} from "./upload-cv.service"

@Resolver()
/** GraphQL entry that authenticates before registering an uploaded CV into `cv_generations`. */
export class UploadCvResolver {
    constructor(
        private readonly uploadCvService: UploadCvService,
    ) { }

    /**
     * Register a CV the user UPLOADED (already PUT to storage via the presign
     * flow) into the unified `cv_generations` table as `source = uploaded`, then
     * enqueue async scoring with the shared rubric. Creates a `Pending` row and
     * returns its id + the scoring job id; requires authentication. Poll
     * `cvGeneration(id)` for status + `score`/`feedback`.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "CV uploaded successfully; scoring started",
        [Locale.Vi]: "Đã tải CV lên thành công; bắt đầu chấm điểm", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => UploadCvResponse,
        {
            name: "uploadCv",
            description: "Register an uploaded CV into the unified table + enqueue scoring.",
        },
    )
    async execute(
        @Args("request")
            request: UploadCvRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.uploadCvService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}

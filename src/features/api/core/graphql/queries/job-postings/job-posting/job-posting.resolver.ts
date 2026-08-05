import {
    Args,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseInterceptors,
} from "@nestjs/common"
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
    JobPostingEntity,
} from "@modules/databases/postgresql/primary/entities/job-posting.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    JobPostingResponse,
} from "./graphql-types/response"
import {
    JobPostingService,
} from "./job-posting.service"

@Resolver()
/**
 * Public job posting detail page -- no auth required, mirrors
 * `headhuntingCompany` (read-only public directory data).
 */
export class JobPostingResolver {
    constructor(
        private readonly jobPostingService: JobPostingService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Job posting fetched successfully",
        [Locale.Vi]: "Lấy tin tuyển dụng thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => JobPostingResponse,
        {
            name: "jobPosting",
            description: "Fetches one job posting by its public display id, with the employer company resolved.",
        },
    )
    async execute(
        @Args(
            "displayId",
            {
                type: () => String,
                description: "Public display id (slug) of the job posting.",
            },
        )
            displayId: string,
    ): Promise<JobPostingEntity> {
        return this.jobPostingService.execute({
            request: {
                displayId,
            },
        })
    }
}

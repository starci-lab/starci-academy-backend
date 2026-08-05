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
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
} from "@modules/databases"
import {
    JobPostingsRequest,
    JobPostingsResponse,
    JobPostingsData,
} from "./graphql-types"
import {
    JobPostingsService,
} from "./job-postings.service"

@Resolver()
/**
 * Public job board listing — no auth required, mirrors `headhuntingCompanies`
 * (read-only public directory data).
 */
export class JobPostingsResolver {
    constructor(
        private readonly jobPostingsService: JobPostingsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Job postings fetched successfully",
        [Locale.Vi]: "Lấy danh sách tin tuyển dụng thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => JobPostingsResponse,
        {
            name: "jobPostings",
            description: "Lists structured IT job postings (newest first), with optional filters and search.",
        },
    )
    async execute(
        @Args("request")
            request: JobPostingsRequest,
    ): Promise<JobPostingsData> {
        return this.jobPostingsService.execute({
            request,
        })
    }
}

import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    JobStatusReadService,
} from "@modules/bussiness/jobs/atomic/job-status-read.service"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    JobStatusQuery,
} from "./job-status.query"
import type {
    JobStatusResponseData,
} from "./graphql-types/response"

@QueryHandler(JobStatusQuery)
@Injectable()
/** Resolves one job through the shared owner-authorized read service. */
export class JobStatusHandler
    extends ICQRSHandler<JobStatusQuery, JobStatusResponseData>
    implements IQueryHandler<JobStatusQuery, JobStatusResponseData>
{
    constructor(
        private readonly jobStatusReadService: JobStatusReadService,
    ) {
        super()
    }

    protected override async process(
        query: JobStatusQuery,
    ): Promise<JobStatusResponseData> {
        const {
            user,
            request,
        } = query.params
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        return {
            job: await this.jobStatusReadService.getOwned({
                jobId: request.jobId,
                userId: user.id,
            }),
        }
    }
}

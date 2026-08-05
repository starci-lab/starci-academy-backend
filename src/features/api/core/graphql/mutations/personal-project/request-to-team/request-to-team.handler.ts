import {
    Injectable,
} from "@nestjs/common"
import {
    UserEntity,
} from "@modules/databases"
import {
    EnqueueResolveGithubJobService,
} from "@modules/bussiness"
import {
    MissingRequiredParameterException,
} from "@modules/exceptions"
import type {
    RequestToTeamRequest,
    RequestToTeamData,
} from "./graphql-types"

@Injectable()
/**
 * Enqueue a GitHub team-invite for the viewer's enrolled course. Linking a GitHub
 * identity is a prerequisite (separate step) -- without `githubUsername` there is
 * nobody to invite, so we reject and the FE forces the link step first. The invite
 * is async (resolve-github job); GitHub membership flips to `pending` until accepted.
 */
export class RequestToTeamHandler {
    constructor(
        private readonly enqueueResolveGithubJobService: EnqueueResolveGithubJobService,
    ) {}

    async execute(
        user: UserEntity,
        request: RequestToTeamRequest,
    ): Promise<RequestToTeamData> {
        if (!user.githubUsername) {
            // must link a GitHub identity before we can invite it to a team
            throw new MissingRequiredParameterException({
                parameter: "githubUsername",
            })
        }

        // enqueue the async invite job and hand its id back so the FE can subscribe
        // to realtime status (/job_notifications room job:<id>) instead of blocking.
        const job = await this.enqueueResolveGithubJobService.enqueue({
            userId: user.id,
            githubUsername: user.githubUsername,
            courseId: request.courseId,
        })

        return {
            requested: true,
            jobId: job.id,
        }
    }
}

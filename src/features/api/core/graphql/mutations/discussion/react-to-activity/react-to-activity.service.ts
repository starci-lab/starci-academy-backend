import {
    Injectable,
} from "@nestjs/common"
import {
    ReactionService,
} from "@modules/bussiness"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import type {
    ExecuteParams,
} from "@features/api/core/types"
import type {
    ReactionSummaryObject,
} from "../../../shared/discussion"
import type {
    ReactToActivityRequest,
} from "./graphql-types"

/**
 * Mutation service that sets/changes/removes the current user's reaction on a feed
 * activity. The "cannot react to your own activity" rule is enforced in
 * {@link ReactionService.reactToActivity}.
 */
@Injectable()
export class ReactToActivityService {
    constructor(
        private readonly reactionService: ReactionService,
    ) {}

    /**
     * Applies a reaction change on a feed activity.
     * @param params - Execute params carrying the {@link ReactToActivityRequest} + user.
     * @returns The activity's refreshed reaction summary.
     */
    async execute({
        request,
        user,
    }: ExecuteParams<ReactToActivityRequest>): Promise<ReactionSummaryObject> {
        // narrow the optional user (guard already requires auth)
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        // null/omitted type means "remove my reaction"
        return this.reactionService.reactToActivity({
            activityId: request.activityId,
            user,
            type: request.type ?? null,
        })
    }
}

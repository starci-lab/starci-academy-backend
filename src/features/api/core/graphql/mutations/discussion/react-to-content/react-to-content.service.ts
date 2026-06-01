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
    ReactToContentRequest,
} from "./graphql-types"

/**
 * Mutation service that sets/changes/removes the current user's reaction on a content.
 */
@Injectable()
export class ReactToContentService {
    constructor(
        private readonly reactionService: ReactionService,
    ) {}

    /**
     * Applies a reaction change on a content.
     * @param params - Execute params carrying the {@link ReactToContentRequest} + user.
     * @returns The content's refreshed reaction summary.
     */
    async execute({
        request,
        user,
    }: ExecuteParams<ReactToContentRequest>): Promise<ReactionSummaryObject> {
        // narrow the optional user (guards already require auth)
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        // null/omitted type means "remove my reaction"
        return this.reactionService.reactToContent({
            contentId: request.contentId,
            user,
            type: request.type ?? null,
        })
    }
}

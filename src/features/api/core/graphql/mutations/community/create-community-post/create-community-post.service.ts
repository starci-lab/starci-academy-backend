import {
    Injectable,
} from "@nestjs/common"
import {
    CommunityPostService,
} from "@modules/bussiness/community/community-post.service"
import {
    CommunityChannel,
} from "@modules/databases/postgresql/primary/enums/community-channel"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import type {
    ExecuteParams,
} from "../../../../types/execute"
import {
    mapCommunityPostNode,
} from "../../../shared/community/mappers/community-post-node"
import {
    CommunityPostNodeObject,
} from "../../../shared/community/object-types/community-post-node.object"
import type {
    CreateCommunityPostRequest,
} from "./graphql-types/request"

@Injectable()
/**
 * Mutation service that creates a community post and returns its client-facing node.
 */
export class CreateCommunityPostService {
    constructor(
        private readonly communityPostService: CommunityPostService,
    ) {}

    /**
     * Creates a community post (quota-checked for non-members in the domain layer).
     * @param params - Execute params carrying the {@link CreateCommunityPostRequest} + user.
     * @returns The created post node.
     */
    async execute({
        request,
        user,
    }: ExecuteParams<CreateCommunityPostRequest>): Promise<CommunityPostNodeObject> {
        // narrow the optional user (guards already require auth)
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        // persist via the domain service (also runs the quota check + fans out the event)
        const post = await this.communityPostService.createPost({
            user,
            channel: request.channel ?? CommunityChannel.General,
            body: request.body,
        })
        // a brand-new post has no comments and no reactions yet
        return mapCommunityPostNode({
            post,
            reactions: {
                counts: [],
                total: 0,
                myReaction: null,
                viewCount: 0,
                shareCount: 0,
            },
            commentCount: 0,
            viewerId: user.id,
        })
    }
}

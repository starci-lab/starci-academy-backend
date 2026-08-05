import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    CommunityPostEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    CommunityPostForbiddenException,
    CommunityPostNotFoundException,
} from "@modules/exceptions"
import {
    EventEmitterService,
    EventName,
} from "@modules/event"
import {
    envConfig,
} from "@modules/env"
import {
    CommunityPostQuotaService,
} from "./community-post-quota.service"
import type {
    CreateCommunityPostParams,
    DeleteCommunityPostParams,
    DeleteCommunityPostResult,
    ListCommunityFeedParams,
    ListCommunityFeedResult,
    SetCommunityPostPinnedParams,
    UpdateCommunityPostParams,
} from "./types"

@Injectable()
/**
 * Domain service for community posts (the Facebook/Twitter-style feed): create
 * (quota-checked) / edit / soft-delete + paged listing. Ownership is enforced
 * here. Every mutation fans out a local event so the Socket.IO gateway can push
 * the change to the feed/channel room.
 */
export class CommunityPostService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly eventEmitterService: EventEmitterService,
        private readonly communityPostQuotaService: CommunityPostQuotaService,
    ) {}

    /**
     * Loads a post with its author, or throws if it does not exist.
     * @param postId - Post primary id.
     * @returns The post entity with `author` relation loaded.
     */
    async getPostOrThrow(postId: string): Promise<CommunityPostEntity> {
        // load the row with author so callers can build a node + check ownership
        const post = await this.entityManager.findOne(CommunityPostEntity,
            {
                where: {
                    id: postId,
                },
                relations: {
                    author: true,
                },
            })
        // a missing row is a hard not-found for every caller
        if (!post) {
            throw new CommunityPostNotFoundException({
                postId,
            })
        }
        return post
    }

    /**
     * Creates a community post (after a quota check for non-members).
     * @param params - {@link CreateCommunityPostParams}
     * @returns The persisted post (author relation loaded).
     */
    async createPost({
        user,
        channel,
        body,
    }: CreateCommunityPostParams): Promise<CommunityPostEntity> {
        // gate non-members behind the rolling-window post quota before writing
        await this.communityPostQuotaService.assertCanCreatePost({
            userId: user.id,
        })
        // build the row via relation id only -- no need to load the full user row
        const draft = this.entityManager.create(CommunityPostEntity,
            {
                body,
                channel,
                isPinned: false,
                isDeleted: false,
                editedAt: null,
                author: {
                    id: user.id,
                },
            })
        // persist then reload so RelationId virtual columns + author are populated
        const saved = await this.entityManager.save(draft)
        const post = await this.getPostOrThrow(saved.id)
        // notify the channel/feed room so other viewers see the new post
        await this.eventEmitterService.emit({
            event: EventName.CommunityPostCreated,
            payload: {
                postId: post.id,
                channel: post.channel,
            },
        })
        return post
    }

    /**
     * Edits a post's body. Only the author may edit.
     * @param params - {@link UpdateCommunityPostParams}
     * @returns The updated post (author relation loaded).
     */
    async updatePost({
        postId,
        body,
        user,
    }: UpdateCommunityPostParams): Promise<CommunityPostEntity> {
        // load + ownership guard before mutating anything
        const post = await this.getPostOrThrow(postId)
        // reject edits from anyone who is not the author
        if (post.authorId !== user.id) {
            throw new CommunityPostForbiddenException({
                postId,
                userId: user.id,
            })
        }
        // apply the new body and stamp the edit time so the UI can show "(edited)"
        post.body = body
        post.editedAt = new Date()
        await this.entityManager.save(post)
        // fan out so the feed/channel room refetches the edited post
        await this.eventEmitterService.emit({
            event: EventName.CommunityPostUpdated,
            payload: {
                postId: post.id,
                channel: post.channel,
            },
        })
        return post
    }

    /**
     * Soft-deletes a post (keeps the row + comments). Only the author may delete.
     * @param params - {@link DeleteCommunityPostParams}
     * @returns The deleted post id.
     */
    async softDeletePost({
        postId,
        user,
    }: DeleteCommunityPostParams): Promise<DeleteCommunityPostResult> {
        // load + ownership guard
        const post = await this.getPostOrThrow(postId)
        // reject deletes from anyone who is not the author
        if (post.authorId !== user.id) {
            throw new CommunityPostForbiddenException({
                postId,
                userId: user.id,
            })
        }
        // flag as deleted instead of removing so the comment thread shape survives
        post.isDeleted = true
        await this.entityManager.save(post)
        // notify the room so clients drop/placeholder the post
        await this.eventEmitterService.emit({
            event: EventName.CommunityPostDeleted,
            payload: {
                postId: post.id,
                channel: post.channel,
            },
        })
        return {
            id: post.id,
        }
    }

    /**
     * Pins or unpins a post. Founder-only -- the FE shows the control just for the
     * founder, but the gate is enforced here so a forged call still fails.
     * @param params - {@link SetCommunityPostPinnedParams}
     * @returns The updated post (author relation loaded).
     */
    async setPinned({
        postId,
        pinned,
        user,
    }: SetCommunityPostPinnedParams): Promise<CommunityPostEntity> {
        // gate to the founder: anyone else attempting to pin is forbidden
        if (user.username !== envConfig().community.founderUsername) {
            throw new CommunityPostForbiddenException({
                postId,
                userId: user.id,
            })
        }
        // load the post (404 guard) then flip its pinned flag
        const post = await this.getPostOrThrow(postId)
        post.isPinned = pinned
        await this.entityManager.save(post)
        // pin state changes feed ordering -> tell the channel/feed room to refetch
        await this.eventEmitterService.emit({
            event: EventName.CommunityPostUpdated,
            payload: {
                postId: post.id,
                channel: post.channel,
            },
        })
        return post
    }

    /**
     * Lists a page of the community feed (pinned-first, then newest). Soft-deleted
     * posts are excluded from the feed listing.
     * @param params - {@link ListCommunityFeedParams}
     * @returns The page of posts + total count.
     */
    async listFeed({
        channel,
        offset,
        limit,
    }: ListCommunityFeedParams): Promise<ListCommunityFeedResult> {
        // scope to a channel when provided; otherwise list across all channels
        const [
            posts,
            total,
        ] = await this.entityManager.findAndCount(CommunityPostEntity,
            {
                where: {
                    // omit the channel filter entirely when listing across channels
                    ...(channel
                        ? {
                            channel,
                        }
                        : {
                        }),
                    // never surface soft-deleted posts in the feed
                    isDeleted: false,
                },
                relations: {
                    author: true,
                },
                // pinned posts sit on top; within a tier the newest come first
                order: {
                    isPinned: "DESC",
                    createdAt: "DESC",
                },
                skip: offset,
                take: limit,
            })
        return {
            posts,
            total,
        }
    }
}

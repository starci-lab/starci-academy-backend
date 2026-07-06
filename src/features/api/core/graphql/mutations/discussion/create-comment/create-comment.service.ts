import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    CommentService,
    writeActivity,
} from "@modules/bussiness"
import {
    ActivityType,
    ContentEntity,
    CourseEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import type {
    ExecuteParams,
} from "@features/api/core/types"
import {
    CommentNodeObject,
    mapCommentNode,
} from "../../../shared/discussion"
import type {
    CreateCommentRequest,
} from "./graphql-types"

/**
 * Mutation service that creates a comment and returns its client-facing node.
 */
@Injectable()
export class CreateCommentService {
    constructor(
        private readonly commentService: CommentService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Creates a comment (top-level or reply) on a content.
     * @param params - Execute params carrying the {@link CreateCommentRequest} + user.
     * @returns The created comment node.
     */
    async execute({
        request,
        user,
    }: ExecuteParams<CreateCommentRequest>): Promise<CommentNodeObject> {
        // narrow the optional user (guards already require auth)
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        // persist the comment via the domain service (also fans out the realtime event)
        const comment = await this.commentService.createComment({
            contentId: request.contentId,
            courseId: request.courseId,
            parentCommentId: request.parentCommentId,
            body: request.body,
            user,
        })
        // home-feed activity for the comment (idempotent per comment id); target the
        // actual scope the comment resolved to (a reply inherits its parent's scope,
        // so `comment.contentId`/`comment.courseId` are the source of truth here, not
        // the raw request — which may be a reply with no scope fields at all)
        const target = comment.contentId
            ? {
                entityName: ContentEntity.name,
                id: comment.contentId,
                label: (await this.entityManager.findOne(
                    ContentEntity,
                    {
                        where: {
                            id: comment.contentId,
                        },
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                ))?.title ?? "",
            }
            : {
                entityName: CourseEntity.name,
                id: comment.courseId ?? "",
                label: (await this.entityManager.findOne(
                    CourseEntity,
                    {
                        where: {
                            id: comment.courseId ?? "",
                        },
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                ))?.title ?? "",
            }
        await writeActivity({
            entityManager: this.entityManager,
            userId: user.id,
            type: ActivityType.DiscussionCommented,
            idempotencyKey: comment.id,
            metadata: {
                target,
            },
        })
        // a brand-new comment has no replies and no reactions yet
        return mapCommentNode({
            comment,
            replyCount: 0,
            reactions: {
                counts: [],
                total: 0,
                myReaction: null,
                viewCount: 0,
                shareCount: 0,
            },
        })
    }
}

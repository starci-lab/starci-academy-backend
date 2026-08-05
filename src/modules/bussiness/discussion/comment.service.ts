import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    IsNull,
} from "typeorm"
import {
    ContentCommentEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import {
    CommentForbiddenException,
    CommentInvalidScopeException,
    CommentNotFoundException,
} from "@modules/exceptions"
import {
    EventEmitterService,
    EventName,
} from "@modules/event"
import type {
    CreateCommentParams,
    DeleteCommentParams,
    DeleteCommentResult,
    FounderAnsweredRow,
    ListCommentsParams,
    ListCommentsResult,
    ListCourseQuestionsParams,
    ListCourseQuestionsResult,
    ReplyCountRow,
    UpdateCommentParams,
} from "./types"
import {
    CourseQuestionFilter,
} from "./types"

/** Default page size for comment listings. */
const DEFAULT_LIMIT = 20

@Injectable()
/**
 * Domain service for threaded content comments: create/edit/soft-delete + paged listing.
 * Ownership is enforced here (never trust the client). Every mutation fans out a local
 * event so the Socket.IO gateway can push the change to subscribers of the content room.
 */
export class CommentService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly eventEmitterService: EventEmitterService,
    ) {}

    /**
     * Loads a comment with its author, or throws if it does not exist.
     * @param commentId - Comment primary id.
     * @returns The comment entity with `user` relation loaded.
     */
    async getCommentOrThrow(commentId: string): Promise<ContentCommentEntity> {
        // load the row with author so callers can build a node + check ownership
        const comment = await this.entityManager.findOne(ContentCommentEntity,
            {
                where: {
                    id: commentId,
                },
                relations: {
                    user: true,
                },
            })
        // a missing row is a hard 404-style failure for every caller
        if (!comment) {
            throw new CommentNotFoundException({
                commentId,
            })
        }
        return comment
    }

    /**
     * Creates a top-level comment or a reply. A top-level comment must be scoped to
     * exactly one of `contentId` (a lesson question) or `courseId` (a course-general
     * course-general question) -- see {@link CreateCommentParams}. A reply always
     * inherits its scope from the parent (the caller's own scope fields are ignored
     * for a reply, so a reply can never be spoofed into a different scope).
     * @param params - {@link CreateCommentParams}
     * @returns The persisted comment (author relation loaded).
     */
    async createComment({
        contentId,
        courseId,
        parentCommentId,
        body,
        user,
    }: CreateCommentParams): Promise<ContentCommentEntity> {
        // resolved scope for the row about to be created
        let resolvedContentId = contentId ?? null
        let resolvedCourseId = courseId ?? null
        if (parentCommentId) {
            // when replying, make sure the parent really exists, then inherit its scope
            const parent = await this.getCommentOrThrow(parentCommentId)
            resolvedContentId = parent.contentId
            resolvedCourseId = parent.courseId
        } else if (Boolean(resolvedContentId) === Boolean(resolvedCourseId)) {
            // a top-level comment must set EXACTLY one of content/course (never both, never neither)
            throw new CommentInvalidScopeException({
                contentId: resolvedContentId,
                courseId: resolvedCourseId,
            })
        }
        // build the row via relation ids only -- no need to load full content/course/user rows
        const draft = this.entityManager.create(ContentCommentEntity,
            {
                body,
                isDeleted: false,
                editedAt: null,
                content: resolvedContentId ? {
                    id: resolvedContentId,
                } : null,
                course: resolvedCourseId ? {
                    id: resolvedCourseId,
                } : null,
                user: {
                    id: user.id,
                },
                // null parent marks a top-level comment
                parentComment: parentCommentId ? {
                    id: parentCommentId,
                } : null,
            })
        // persist then reload so RelationId virtual columns + author are populated for the node
        const saved = await this.entityManager.save(draft)
        const comment = await this.getCommentOrThrow(saved.id)
        // a course-general question has no per-lesson room to broadcast into -- only
        // per-lesson comments push a realtime update to viewers of that content
        if (resolvedContentId) {
            await this.eventEmitterService.emit({
                event: EventName.CommentCreated,
                payload: {
                    contentId: resolvedContentId,
                    commentId: comment.id,
                    parentCommentId: comment.parentCommentId,
                },
            })
        }
        return comment
    }

    /**
     * Edits a comment's body. Only the author may edit.
     * @param params - {@link UpdateCommentParams}
     * @returns The updated comment (author relation loaded).
     */
    async updateComment({
        commentId,
        body,
        user,
    }: UpdateCommentParams): Promise<ContentCommentEntity> {
        // load + ownership guard before mutating anything
        const comment = await this.getCommentOrThrow(commentId)
        // reject edits from anyone who is not the author
        if (comment.userId !== user.id) {
            throw new CommentForbiddenException({
                commentId,
                userId: user.id,
            })
        }
        // apply the new body and stamp the edit time so the UI can show "(edited)"
        comment.body = body
        comment.editedAt = new Date()
        await this.entityManager.save(comment)
        // fan out so subscribers refetch the edited comment -- only a per-lesson comment
        // has a content room to target; a course-general question has none (its roll-up
        // page re-fetches via normal query, no realtime push needed there).
        if (comment.contentId) {
            await this.eventEmitterService.emit({
                event: EventName.CommentUpdated,
                payload: {
                    contentId: comment.contentId,
                    commentId: comment.id,
                    parentCommentId: comment.parentCommentId,
                },
            })
        }
        return comment
    }

    /**
     * Soft-deletes a comment (keeps the row + replies). Only the author may delete.
     * @param params - {@link DeleteCommentParams}
     * @returns The deleted comment id.
     */
    async softDeleteComment({
        commentId,
        user,
    }: DeleteCommentParams): Promise<DeleteCommentResult> {
        // load + ownership guard
        const comment = await this.getCommentOrThrow(commentId)
        // reject deletes from anyone who is not the author
        if (comment.userId !== user.id) {
            throw new CommentForbiddenException({
                commentId,
                userId: user.id,
            })
        }
        // flag as deleted instead of removing so child replies + thread shape survive
        comment.isDeleted = true
        await this.entityManager.save(comment)
        // notify the room so clients swap the body for a "[deleted]" placeholder --
        // course-general questions have no content room (see updateComment above).
        if (comment.contentId) {
            await this.eventEmitterService.emit({
                event: EventName.CommentDeleted,
                payload: {
                    contentId: comment.contentId,
                    commentId: comment.id,
                    parentCommentId: comment.parentCommentId,
                },
            })
        }
        return {
            id: comment.id,
        }
    }

    /**
     * Lists comments -- top-level comments of a lesson/course scope by default, or one
     * parent's replies when `parentCommentId` is provided. Paged (1-based).
     *
     * A reply listing is scoped by `parentCommentId` ALONE -- the parent already pins the
     * exact thread, so no separate content/course match is needed (and a course-general
     * question's replies have no `contentId` to match against anyway). A top-level listing
     * requires exactly one of `contentId`/`courseId`.
     * @param params - {@link ListCommentsParams}
     * @returns The page of comments + total count.
     */
    async listComments({
        contentId,
        courseId,
        parentCommentId,
        page = 1,
        limit = DEFAULT_LIMIT,
    }: ListCommentsParams): Promise<ListCommentsResult> {
        // translate 1-based page into an offset; clamp to non-negative
        const skip = Math.max(0,
            page - 1) * limit
        // a top-level listing must pin EXACTLY one scope -- an unscoped `where` would
        // silently match every comment across every content/course (TypeORM ignores
        // `undefined` conditions), so guard against a caller omitting both
        if (!parentCommentId && Boolean(contentId) === Boolean(courseId)) {
            throw new CommentInvalidScopeException({
                contentId: contentId ?? null,
                courseId: courseId ?? null,
            })
        }
        // replies: scoped by parent alone; top-level: scoped by content OR course
        const where = parentCommentId
            ? {
                parentComment: {
                    id: parentCommentId,
                },
            }
            : {
                content: contentId ? {
                    id: contentId,
                } : undefined,
                course: courseId ? {
                    id: courseId,
                } : undefined,
                parentComment: IsNull(),
            }
        const [comments,
            total] = await this.entityManager.findAndCount(ContentCommentEntity,
            {
                where,
                relations: {
                    user: true,
                },
                // chronological order keeps a thread readable top-to-bottom
                order: {
                    createdAt: "ASC",
                },
                skip,
                take: limit,
            })
        return {
            comments,
            total,
        }
    }

    /**
     * Counts direct replies for a set of comments in one grouped query (avoids N+1).
     * @param commentIds - Parent comment ids to count replies for.
     * @returns Map of comment id -> direct reply count (missing key = 0).
     */
    async countReplies(commentIds: Array<string>): Promise<Record<string, number>> {
        // nothing to count -> cheap exit, also avoids an empty IN () clause
        if (commentIds.length === 0) {
            return {
            }
        }
        // one grouped COUNT keyed by parent id rather than a query per comment
        const rows = await this.entityManager
            .createQueryBuilder(ContentCommentEntity,
                "comment")
            .select("comment.parent_comment_id",
                "parentId")
            .addSelect("COUNT(*)",
                "count")
            .where("comment.parent_comment_id IN (:...commentIds)",
                {
                    commentIds,
                })
            .groupBy("comment.parent_comment_id")
            .getRawMany<ReplyCountRow>()
        // fold the raw rows into a lookup the resolver can index per comment
        return rows.reduce<Record<string, number>>((acc, row) => {
            acc[row.parentId] = Number(row.count)
            return acc
        },
        {
        })
    }

    /**
     * Returns the set of question ids (from the given ids) that have at least one
     * reply authored by the founder -- used to flag "officially answered" questions.
     * @param questionIds - Top-level comment ids to test for a founder reply.
     * @returns A set of the ids that have a founder reply (subset of the input).
     */
    async findFounderAnswered(questionIds: Array<string>): Promise<Set<string>> {
        // empty input -> nothing to test; also avoids an invalid empty IN () clause
        if (questionIds.length === 0) {
            return new Set<string>()
        }
        // the founder username is env-driven so it can differ per deployment
        const founderUsername = envConfig().community.founderUsername
        // distinct parent ids among replies whose author is the founder
        const rows = await this.entityManager
            .createQueryBuilder(ContentCommentEntity,
                "reply")
            // join the reply author to filter by their username
            .innerJoin("reply.user",
                "author")
            .select("DISTINCT reply.parent_comment_id",
                "parentId")
            // only replies of the questions on this page, authored by the founder
            .where("reply.parent_comment_id IN (:...questionIds)",
                {
                    questionIds,
                })
            .andWhere("author.username = :founderUsername",
                {
                    founderUsername,
                })
            // exclude soft-deleted replies so a removed founder answer does not count
            .andWhere("reply.is_deleted = false")
            .getRawMany<FounderAnsweredRow>()
        // fold the flat rows into a fast membership set for the mapper
        return new Set(rows.map((row) => row.parentId))
    }

    /**
     * Lists a course's questions: top-level, non-deleted comments across ALL lessons
     * of the course, with answer aggregates. The answered/unanswered filter is folded
     * into the WHERE via an EXISTS subquery so pagination + `total` reflect the filter.
     * @param params - {@link ListCourseQuestionsParams}
     * @returns The page of question rows (each carrying reply count + founder-answer flag) + total.
     */
    async listCourseQuestions({
        courseId,
        filter,
        search,
        page = 1,
        limit = DEFAULT_LIMIT,
        userId,
    }: ListCourseQuestionsParams): Promise<ListCourseQuestionsResult> {
        // translate 1-based page into a row offset; clamp to non-negative
        const skip = Math.max(0,
            page - 1) * limit
        // base query: top-level comments in this course -- either a per-lesson question
        // (content -> module -> course) OR a course-general question (comment.course_id
        // set directly, no content). LEFT joins so a course-general row's null content
        // does not exclude it; the WHERE below accepts EITHER path.
        const queryBuilder = this.entityManager
            .createQueryBuilder(ContentCommentEntity,
                "comment")
            .leftJoin("comment.content",
                "content")
            .leftJoin("content.module",
                "module")
            .leftJoin("module.course",
                "lessonCourse")
            // load the content (title + module id) and author for the node mapping
            .leftJoinAndSelect("comment.content",
                "contentSelected")
            .leftJoinAndSelect("contentSelected.module",
                "moduleSelected")
            .leftJoinAndSelect("comment.user",
                "user")
            // scope: this course, via either path
            .where(
                "(lessonCourse.id = :courseId OR comment.course_id = :courseId)",
                {
                    courseId,
                },
            )
            // a "question" is a top-level (non-reply), non-deleted comment
            .andWhere("comment.parent_comment_id IS NULL")
            .andWhere("comment.is_deleted = false")
        // optional case-insensitive body match; trim to ignore blank search
        const trimmedSearch = search?.trim()
        if (trimmedSearch) {
            // ILIKE with wildcards for a substring match, parameterised to stay safe
            queryBuilder.andWhere("comment.body ILIKE :search",
                {
                    search: `%${trimmedSearch}%`,
                })
        }
        // `mine` -> restrict to questions the caller authored
        if (filter === CourseQuestionFilter.Mine) {
            queryBuilder.andWhere("comment.user_id = :userId",
                {
                    userId,
                })
        }
        // answered/unanswered folded into WHERE via EXISTS so `total` matches the filter.
        // a reply = a non-deleted comment whose parent is this question.
        if (filter === CourseQuestionFilter.Unanswered) {
            // no non-deleted reply exists -> still in the answering queue
            queryBuilder.andWhere(
                "NOT EXISTS (SELECT 1 FROM content_comments reply WHERE reply.parent_comment_id = comment.id AND reply.is_deleted = false)",
            )
        } else if (filter === CourseQuestionFilter.Answered) {
            // at least one non-deleted reply exists -> already answered
            queryBuilder.andWhere(
                "EXISTS (SELECT 1 FROM content_comments reply WHERE reply.parent_comment_id = comment.id AND reply.is_deleted = false)",
            )
        }
        // ordering: unanswered surfaces the oldest first (a FIFO answering queue);
        // every other view shows the newest question first
        queryBuilder.orderBy("comment.created_at",
            filter === CourseQuestionFilter.Unanswered ? "ASC" : "DESC")
        // apply pagination window and run count + rows in one round-trip
        const [comments,
            total] = await queryBuilder
            .skip(skip)
            .take(limit)
            .getManyAndCount()
        // collect the page's question ids once to batch the two aggregate lookups
        const questionIds = comments.map((comment) => comment.id)
        // reply (answer) counts per question, and the founder-answered membership set
        const replyCounts = await this.countReplies(questionIds)
        const founderAnswered = await this.findFounderAnswered(questionIds)
        // assemble rows: entity + computed aggregates the resolver maps into nodes
        const questions = comments.map((comment) => ({
            comment,
            // missing key in the grouped count means zero replies
            replyCount: replyCounts[comment.id] ?? 0,
            // membership in the set means an official (founder) answer exists
            answeredByFounder: founderAnswered.has(comment.id),
        }))
        return {
            questions,
            total,
        }
    }
}

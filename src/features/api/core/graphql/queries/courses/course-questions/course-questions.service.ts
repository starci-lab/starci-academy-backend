import {
    Injectable,
} from "@nestjs/common"
import {
    CommentService,
    CourseQuestionFilter,
} from "@modules/bussiness"
import {
    envConfig,
} from "@modules/env"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import type {
    ExecuteParams,
} from "@features/api/core/types"
import type {
    CourseQuestionsPageObject,
} from "./graphql-types"
import type {
    CourseQuestionsRequest,
} from "./graphql-types"

/**
 * Query service for the course Q&A roll-up. Loads a page of top-level questions across
 * all lessons of a course (with reply counts + founder-answer flags already computed by
 * the domain service) and maps each row into a client-facing node.
 */
@Injectable()
export class CourseQuestionsService {
    constructor(
        private readonly commentService: CommentService,
    ) {}

    /**
     * Lists a course's questions and assembles client-facing nodes.
     * @param params - Execute params carrying the {@link CourseQuestionsRequest} + user.
     * @returns A page of course question nodes + total count.
     */
    async execute({
        request,
        user,
    }: ExecuteParams<CourseQuestionsRequest>): Promise<CourseQuestionsPageObject> {
        // guards already require auth, but narrow the optional user for safety
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        // the founder username drives the per-node "is the author the founder" flag
        const founderUsername = envConfig().community.founderUsername
        // pull the requested page of questions with their computed answer aggregates
        const {
            questions,
            total,
        } = await this.commentService.listCourseQuestions({
            courseId: request.courseId,
            // default to "all" when the client omits the filter
            filter: request.filter ?? CourseQuestionFilter.All,
            search: request.search,
            page: request.page,
            limit: request.limit,
            // `mine` resolves against the authenticated caller
            userId: user.id,
        })
        // map each row into a node; content (+ module) and author were eager-loaded upstream
        const nodes = questions.map((question) => {
            // the comment carries its content and author relations from the query
            const {
                comment,
                replyCount,
                answeredByFounder,
            } = question
            return {
                // identity + body straight from the comment row
                id: comment.id,
                body: comment.body,
                createdAt: comment.createdAt,
                editedAt: comment.editedAt,
                // author relation loaded by the domain query
                author: comment.user,
                // lesson context: null for a course-general question (no specific lesson)
                contentId: comment.content?.id ?? null,
                contentTitle: comment.content?.title ?? null,
                moduleId: comment.content?.module.id ?? null,
                // answer aggregates computed by the domain service
                replyCount,
                answeredByFounder,
                // the question author is the founder when their username matches config
                isFounderAuthor: comment.user.username === founderUsername,
            }
        })
        return {
            questions: nodes,
            total,
        }
    }
}

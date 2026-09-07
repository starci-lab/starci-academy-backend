import {
    Injectable
} from "@nestjs/common"
import {
    EntityManager
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    CourseEntity
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    UserEntity
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    EffectiveLearnerAccessService
} from "@modules/bussiness/pro-subscription/effective-learner-access.service"
import {
    CourseCommunityService
} from "@modules/bussiness/community/course-community.service"
import {
    CourseCommunityUnavailableException
} from "@modules/platform/exceptions/errors/community/course-community"
import type {
    CommunityPostEntity
} from "@modules/databases/postgresql/primary/entities/community-post.entity"
import type {
    CommunityPostCommentEntity
} from "@modules/databases/postgresql/primary/entities/community-post-comment.entity"
import type {
    CourseCommunityCommentNode,
    CourseCommunityPostNode,
} from "./course-community-graphql.types"

@Injectable()
/** Authorizes and projects course-scoped community data for GraphQL consumers. */
export class CourseCommunityApiService {
    constructor(
    @InjectPrimaryPostgreSQLEntityManager()
    private readonly manager: EntityManager,
    private readonly effectiveLearnerAccess: EffectiveLearnerAccessService,
    readonly community: CourseCommunityService,
    ) {}

    async authorize(courseDisplayId: string, user: UserEntity): Promise<string> {
        const course = await this.manager.findOne(CourseEntity,
            {
                where: {
                    displayId: courseDisplayId,
                },
                select: {
                    id: true,
                },
            })
        if (
            !course ||
      !(await this.effectiveLearnerAccess.hasCourseAccess(user.id,
          course.id))
        )
            throw new CourseCommunityUnavailableException({
            })
        return course.id
    }

    async postNodes(
        courseId: string,
        posts: Array<CommunityPostEntity>,
        viewerId: string,
    ): Promise<Array<CourseCommunityPostNode>> {
        const aggregate = await this.community.aggregatePosts(
            courseId,
            posts.map((post) => post.id),
            viewerId,
        )
        return posts.map((post) => ({
            id: post.id,
            body: post.isDeleted ? "" : post.body,
            isDeleted: post.isDeleted,
            editedAt: post.editedAt,
            createdAt: post.createdAt,
            author: post.author,
            commentCount: aggregate.comments[post.id] ?? 0,
            reactions: aggregate.reactions[post.id],
            isMine: post.authorId === viewerId,
        }))
    }

    async postNode(
        courseId: string,
        post: CommunityPostEntity,
        viewerId: string,
    ): Promise<CourseCommunityPostNode> {
        return (await this.postNodes(courseId,
            [post],
            viewerId))[0]
    }

    async commentNodes(
        courseId: string,
        comments: Array<CommunityPostCommentEntity>,
        viewerId: string,
    ): Promise<Array<CourseCommunityCommentNode>> {
        const aggregate = await this.community.aggregateComments(
            courseId,
            comments.map((comment) => comment.id),
            viewerId,
        )
        return comments.map((comment) => ({
            id: comment.id,
            body: comment.isDeleted ? "" : comment.body,
            isDeleted: comment.isDeleted,
            editedAt: comment.editedAt,
            createdAt: comment.createdAt,
            parentCommentId: comment.parentCommentId,
            author: comment.user,
            replyCount: aggregate.replies[comment.id] ?? 0,
            reactions: aggregate.reactions[comment.id],
            isMine: comment.userId === viewerId,
        }))
    }

    async commentNode(
        courseId: string,
        comment: CommunityPostCommentEntity,
        viewerId: string,
    ): Promise<CourseCommunityCommentNode> {
        return (await this.commentNodes(courseId,
            [comment],
            viewerId))[0]
    }
}

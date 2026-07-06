import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    UserEntity,
} from "@modules/databases"

/**
 * A single course question shaped for the client: a top-level content comment with
 * its author, the lesson it belongs to, and answer aggregates (reply count + founder
 * flags) so the UI can render the Q&A roll-up without extra queries.
 */
@ObjectType({
    description: "A course question (top-level content comment) with lesson context and answer aggregates.",
})
export class CourseQuestionNodeObject {
    /** Question (comment) primary id. */
    @Field(
        () => ID,
        {
            description: "Question (comment) primary id.",
        },
    )
        id: string

    /** Question body authored by the user. */
    @Field(
        () => String,
        {
            description: "Question body authored by the user.",
        },
    )
        body: string

    /** Row creation timestamp. */
    @Field(
        () => Date,
        {
            description: "Row creation timestamp.",
        },
    )
        createdAt: Date

    /** Timestamp of the last edit (null if never edited). */
    @Field(
        () => Date,
        {
            nullable: true,
            description: "Timestamp of the last edit (null if never edited).",
        },
    )
        editedAt: Date | null

    /** Author of the question. */
    @Field(
        () => UserEntity,
        {
            description: "Author of the question.",
        },
    )
        author: UserEntity

    /** Id of the lesson content this question belongs to; null for a course-general question. */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Id of the lesson content this question belongs to; null for a course-general question.",
        },
    )
        contentId: string | null

    /** Title of the lesson content this question belongs to; null for a course-general question. */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Title of the lesson content this question belongs to; null for a course-general question.",
        },
    )
        contentTitle: string | null

    /** Id of the module the lesson content belongs to; null for a course-general question. */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Id of the module the lesson content belongs to; null for a course-general question.",
        },
    )
        moduleId: string | null

    /** Number of direct replies (answers) to this question. */
    @Field(
        () => Int,
        {
            description: "Number of direct replies (answers) to this question.",
        },
    )
        replyCount: number

    /** Whether at least one reply was authored by the founder (an official answer). */
    @Field(
        () => Boolean,
        {
            description: "Whether at least one reply was authored by the founder (an official answer).",
        },
    )
        answeredByFounder: boolean

    /** Whether the question author is the founder. */
    @Field(
        () => Boolean,
        {
            description: "Whether the question author is the founder.",
        },
    )
        isFounderAuthor: boolean
}

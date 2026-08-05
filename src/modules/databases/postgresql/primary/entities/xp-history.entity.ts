import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    RelationId,
    Unique,
} from "typeorm"
import {
    GraphQLTypeXpSource,
    XpSource,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"
import {
    CourseEntity,
} from "./course.entity"

@ObjectType({
    description: "Append-only record of XP earned by a user.",
})
@Unique(["source",
    "refId"])
@Index(["user"])
@Entity("xp_histories")
/**
 * Append-only audit ledger of XP a user earned. One row per earning event
 * (passed challenge attempt, first lesson read, passed milestone task). The
 * per-course leaderboard still COMPUTES rank on the fly -- this ledger is the
 * queryable history shown to the user, not the source of truth for ranking.
 *
 * `(source, refId)` is unique so the same event can never be double-recorded
 * (e.g. a re-graded attempt, a re-read lesson, a re-passed milestone task).
 */
export class XpHistoryEntity extends UuidAbstractEntity {
    /**
     * User who earned the XP.
     */
    @Field(
        () => UserEntity,
        {
            description: "User who earned the XP.",
        },
    )
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_xp_histories_users",
    })
        user: UserEntity

    /**
     * User ID who earned the XP.
     */
    @Field(
        () => ID,
        {
            description: "User ID who earned the XP.",
        },
    )
    @RelationId(
        (xpHistory: XpHistoryEntity) => xpHistory.user,
    )
        userId: string

    /**
     * Course the XP belongs to (XP is ranked per course); null for course-agnostic events.
     */
    @Field(
        () => CourseEntity,
        {
            nullable: true,
            description: "Course the XP belongs to.",
        },
    )
    @ManyToOne(
        () => CourseEntity,
        {
            onDelete: "CASCADE",
            nullable: true,
        },
    )
    @JoinColumn({
        name: "course_id",
        foreignKeyConstraintName: "fk_course_id_xp_histories_courses",
    })
        course: CourseEntity | null

    /**
     * Course ID the XP belongs to.
     */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Course ID the XP belongs to.",
        },
    )
    @RelationId(
        (xpHistory: XpHistoryEntity) => xpHistory.course,
    )
        courseId: string | null

    /**
     * Where the XP came from (challenge / lessonRead / milestone).
     */
    @Field(
        () => GraphQLTypeXpSource,
        {
            description: "Where the XP came from (challenge / lessonRead / milestone).",
        },
    )
    @Column({
        name: "source",
        type: "enum",
        enum: XpSource,
        enumName: "xp_source",
    })
        source: XpSource

    /**
     * Amount of XP earned in this event.
     */
    @Field(
        () => Int,
        {
            description: "Amount of XP earned in this event.",
        },
    )
    @Column({
        name: "amount",
        type: "int",
    })
        amount: number

    /**
     * Coin granted by this same event (credited to `users.coin_balance`).
     * Tracked separately from XP so the Coin/XP formula can diverge later.
     */
    @Field(
        () => Int,
        {
            description: "Reward points granted by this event.",
        },
    )
    @Column({
        name: "points",
        type: "int",
        default: 0,
    })
        points: number

    /**
     * Stable id of the originating row (attempt / user-content / user-milestone-task).
     * Combined with `source`, makes each earning event idempotent (unique).
     */
    @Field(
        () => ID,
        {
            description: "Id of the originating row that produced this XP.",
        },
    )
    @Column({
        name: "ref_id",
        type: "varchar",
        length: 64,
    })
        refId: string
}

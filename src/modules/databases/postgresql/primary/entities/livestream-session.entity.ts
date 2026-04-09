import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    RelationId,
} from "typeorm"
import {
    DayOfWeek,
    GraphQLTypeDayOfWeek,
} from "../enums"
import {
    CourseEntity,
} from "./course.entity"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    LivestreamSessionTranslationEntity,
} from "./livestream-session-translation.entity"

/**
 * Recurring weekly livestream slot for a course (calendar template).
 * Optional {@link LivestreamSessionEntity.note} uses default locale; use {@link LivestreamSessionTranslationEntity} for overrides.
 */
@ObjectType({
    description:
        "Recurring weekly livestream slot for a course; superseded rows are ignored after overrides.",
})
@Entity("livestream_sessions")
export class LivestreamSessionEntity extends UuidAbstractEntity {
    @ManyToOne(
        () => CourseEntity,
        (course: CourseEntity) => course.livestreamSessions,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "course_id",
        foreignKeyConstraintName:
            "fk_course_id_livestream_sessions_courses",
    })
        course: CourseEntity

    /**
     * Mirrors {@link LivestreamSessionEntity.course} FK; do not define a second `@Column` for `course_id`
     * or TypeORM may NULL the FK on update when `course` is not hydrated.
     */
    @Field(
        () => ID,
        {
            nullable: false,
            description: "Parent course ID (required).",
        },
    )
    @RelationId(
        (session: LivestreamSessionEntity) => session.course,
    )
        courseId: string

    @Field(
        () => GraphQLTypeDayOfWeek,
        {
            description: "Day of week for this slot.",
        },
    )
    @Column({
        name: "day_of_week",
        type: "enum",
        enum: DayOfWeek,
        enumName: "day_of_week",
    })
        dayOfWeek: DayOfWeek

    /**
     * Wall-clock start time (no timezone; interpret in the course’s display timezone).
     */
    @Field(
        () => String,
        {
            description:
                "Start time (PostgreSQL time), e.g. HH:mm:ss; wall-clock in course locale context.",
        },
    )
    @Column({
        name: "start_time",
        type: "time",
    })
        startTime: string

    /**
     * Wall-clock expected end time (no timezone).
     */
    @Field(
        () => String,
        {
            description:
                "Expected end time (PostgreSQL time), e.g. HH:mm:ss; wall-clock in course locale context.",
        },
    )
    @Column({
        name: "expected_end_time",
        type: "time",
    })
        expectedEndTime: string

    /**
     * Optional short note for this slot (default locale); localized variants use translations.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional note for this livestream slot (default locale).",
        },
    )
    @Column({
        name: "note",
        type: "text",
        nullable: true,
    })
        note: string | null

    /**
     * When true, this row is treated as inactive (e.g. superseded by an override) and should be ignored in UI/API.
     */
    @Field(
        () => Boolean,
        {
            description:
                "If true, this slot can be overridden by a newer override.",
        },
    )
    @Column({
        name: "is_overridable",
        type: "boolean",
        default: false,
    })
        isOverridable?: boolean

    /**
     * Localized overrides for fields such as `note`.
     */
    @Field(
        () => [LivestreamSessionTranslationEntity],
        {
            description: "Localized overrides for livestream session fields (e.g. note).",
        },
    )
    @OneToMany(
        () => LivestreamSessionTranslationEntity,
        (translation: LivestreamSessionTranslationEntity) => translation.livestreamSession,
        {
            cascade: true,
        },
    )
        translations: Array<LivestreamSessionTranslationEntity>

    /**
     * Display order within the course livestream session list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the livestream session list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number
}

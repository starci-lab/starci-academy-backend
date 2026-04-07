import {
    Field, ID, Int, ObjectType
} from "@nestjs/graphql"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    Column, Entity, JoinColumn, ManyToOne, OneToMany, RelationId,
} from "typeorm"
import {
    CourseEntity
} from "./course.entity"
import {
    UuidAbstractEntity
} from "./abstract"
import {
    QnaTranslationEntity,
} from "./qna-translation.entity"

/**
 * Frequently asked question and answer pair for a course landing page.
 */
@ObjectType({
    description: "Question and answer entry for a course."
})
@Entity("qnas")
export class QnaEntity extends UuidAbstractEntity {
    /**
     * FAQ question text.
     */
    @Field(() => String,
        {
            description: "FAQ question text."
        })
    @Column({
        name: "question",
        type: "text"
    })
        question: string

    /**
     * FAQ answer text.
     */
    @Field(() => String,
        {
            description: "FAQ answer text."
        })
    @Column({
        name: "answer",
        type: "text"
    })
        answer: string

    /**
     * Display order within the course Q&A list.
     */
    @Field(() => Int,
        {
            description: "Display order within the course Q&A list."
        })
    @Column({
        name: "order_index",
        type: "int",
        default: 0
    })
        orderIndex: number

    /**
     * Default locale for the Q&A.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this Q&A row.",
        },
    )
    @Column({
        name: "default_locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        defaultLocale: Locale

    /**
     * Course this Q&A belongs to.
     */
    @Field(() => CourseEntity,
        {
            description: "Course this Q&A belongs to."
        })
    @ManyToOne(() => CourseEntity,
        (course: CourseEntity) => course.qnas,
        {
            onDelete: "CASCADE"
        })
    @JoinColumn({
        name: "course_id",
        foreignKeyConstraintName: "fk_course_id_qnas_courses",
    })
        course: CourseEntity

    @Field(
        () => ID,
        {
            description: "Parent course ID.",
        },
    )
    @RelationId(
        (q: QnaEntity) => q.course,
    )
        courseId: string

    /**
     * Localized translations of Q&A fields such as question and answer.
     */
    @Field(
        () => [QnaTranslationEntity],
        {
            description: "Localized overrides for Q&A fields (e.g. question, answer).",
        },
    )
    @OneToMany(
        () => QnaTranslationEntity,
        (qnaTranslation: QnaTranslationEntity) => qnaTranslation.qna,
        {
            cascade: true,
        },
    )
        translations: Array<QnaTranslationEntity>
}

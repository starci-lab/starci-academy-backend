import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    InterviewQuestionEntity,
} from "./interview-question.entity"

/**
 * One programming-language variant of a mock-interview question's GIVEN code
 * (technical `debug`/`review`/`optimize` only) — same conceptual bug/snippet,
 * authored once per language in {@link DEFAULT_PROGRAMMING_LANGUAGES} order
 * (`typescript`/`java`/`csharp`/`go`) so the candidate can pick which one to
 * solve in. Mirrors the `ChallengeStepLangEntity` shape (one child row per
 * language), minus the per-locale translation layer — given code isn't
 * translated, only per-language.
 */
@Entity("interview_question_given_codes")
@Index("idx_interview_question_given_codes_question",
    ["interviewQuestionId"])
export class InterviewQuestionGivenCodeEntity extends UuidAbstractEntity {
    /** Programming language this code variant is written in (e.g. "typescript"). */
    @Column({
        type: "varchar", length: 32
    })
        lang: string

    /** Authored order (falls back to `DEFAULT_PROGRAMMING_LANGUAGES` order at read time either way). */
    @Column({
        name: "sort_index", type: "int", default: 0
    })
        sortIndex: number

    /** The given code itself, in {@link lang}. */
    @Column({
        type: "text"
    })
        code: string

    /** Parent question this variant belongs to. */
    @ManyToOne(
        () => InterviewQuestionEntity,
        (question: InterviewQuestionEntity) => question.givenCodes,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "interview_question_id",
        foreignKeyConstraintName: "fk_interview_question_id_interview_question_given_codes",
    })
        question: InterviewQuestionEntity

    /** Parent question ID (FK column, for direct queries without loading the relation). */
    @Column({
        name: "interview_question_id", type: "uuid"
    })
        interviewQuestionId: string
}

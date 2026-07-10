import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    MockInterviewEntity,
} from "./mock-interview.entity"
import {
    MockInterviewLangTranslationEntity,
} from "./mock-interview-lang-translation.entity"

/**
 * Per-programming-language variant of a {@link MockInterviewEntity}'s GIVEN CODE
 * (`kind ∈ {debug, review, optimize, coding}`) — one row per language
 * (`typescript`/`java`/`csharp`/`go`/`agnostic`). Only populated for questions
 * grounded in a multi-language module (e.g. a lesson with parallel
 * `bodies/{0-typescript,1-java,2-csharp,3-go}` tracks) where a single
 * `givenCode`/`givenLang` on the parent row would unfairly favor one stack.
 * The conceptual `prompt`/`rubric`/`idealAnswer` stay on the parent, shared
 * across every language variant.
 */
@Entity("mock_interview_langs")
@Index("idx_mock_interview_langs_interview",
    ["mockInterview"])
@Index("uq_mock_interview_langs_interview_lang",
    ["mockInterview",
        "lang"],
    {
        unique: true,
    })
export class MockInterviewLangEntity extends UuidAbstractEntity {
    /** Programming language of this variant (or `agnostic`). */
    @Column({
        name: "lang",
        type: "varchar",
        length: 64,
    })
        lang: string

    /** GIVEN code snippet for this language (default-locale body). */
    @Column({
        name: "given_code",
        type: "text",
    })
        givenCode: string

    /** Display order among this question's language variants. */
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /** Pure ordering index used to reorder the list (decoupled from orderIndex). */
    @Column({
        name: "sort_index",
        type: "int",
        default: 0,
    })
        sortIndex: number

    /** Locale the authored `givenCode` is in (varchar — matches `MockInterviewEntity.defaultLocale`'s enum-trap-free convention). */
    @Column({
        name: "default_locale",
        type: "varchar",
        length: 8,
        default: "vi",
    })
        defaultLocale: string

    /** Mock-interview question this language variant belongs to. */
    @ManyToOne(
        () => MockInterviewEntity,
        (mockInterview: MockInterviewEntity) => mockInterview.langs,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "mock_interview_id",
        foreignKeyConstraintName: "fk_mi_langs_mi",
    })
        mockInterview: MockInterviewEntity

    @RelationId(
        (lang: MockInterviewLangEntity) => lang.mockInterview,
    )
        mockInterviewId: string

    /** Bilingual overrides for this variant's `givenCode`. */
    @OneToMany(
        () => MockInterviewLangTranslationEntity,
        (translation: MockInterviewLangTranslationEntity) => translation.mockInterviewLang,
        {
            cascade: true,
        },
    )
        translations: Array<MockInterviewLangTranslationEntity>
}

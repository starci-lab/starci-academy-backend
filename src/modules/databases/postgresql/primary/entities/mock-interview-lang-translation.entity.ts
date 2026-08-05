import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "typeorm"
import {
    AbstractEntity,
} from "./abstract"
import {
    MockInterviewLangEntity,
} from "./mock-interview-lang.entity"

@Entity("mock_interview_lang_translations")
/**
 * Bilingual override for one field of {@link MockInterviewLangEntity} (currently
 * only `givenCode`), keyed `(mockInterviewLangId, locale, field)` -- same shape as
 * {@link MockInterviewTranslationEntity}/`MilestoneTaskBriefTranslationEntity`.
 */
export class MockInterviewLangTranslationEntity extends AbstractEntity {
    @PrimaryColumn({
        name: "mock_interview_lang_id",
        type: "uuid",
    })
        mockInterviewLangId: string

    @PrimaryColumn({
        name: "locale",
        type: "varchar",
        length: 8,
    })
        locale: string

    @PrimaryColumn({
        name: "field",
        type: "varchar",
        length: 128,
    })
        field: string

    @Column({
        name: "value",
        type: "text",
    })
        value: string

    @ManyToOne(
        () => MockInterviewLangEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "mock_interview_lang_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_mil_id_mil_trans_mils",
    })
        mockInterviewLang: MockInterviewLangEntity
}

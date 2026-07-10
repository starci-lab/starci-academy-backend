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
    MockInterviewEntity,
} from "./mock-interview.entity"

/**
 * Bilingual override for one field of {@link MockInterviewEntity}, keyed
 * `(mockInterviewId, locale, field)` — same house pattern as
 * `ContentTranslationEntity`/`MilestoneTaskBriefTranslationEntity`. Only needed
 * for the locale OTHER than the row's `defaultLocale`.
 *
 * `value` is plain text for text fields (`prompt`/`idealAnswer`/`ownershipSignal`).
 * For the jsonb-array fields (`rubric`/`followUps`/`hints`/`keywords`/`tags`),
 * `value` holds the JSON-serialized array as a string — callers must
 * `JSON.parse` it back when reading a non-default-locale override for one of
 * those fields.
 */
@Entity("mock_interview_translations")
export class MockInterviewTranslationEntity extends AbstractEntity {
    @PrimaryColumn({
        name: "mock_interview_id",
        type: "uuid",
    })
        mockInterviewId: string

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
        () => MockInterviewEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "mock_interview_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_mi_id_mi_trans_mis",
    })
        mockInterview: MockInterviewEntity
}

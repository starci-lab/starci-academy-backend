import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
} from "typeorm"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    QnaEntity,
} from "./qna.entity"

/**
 * Translation entity storing localized values for Q&A fields.
 *
 * Each row represents:
 * (qnaId, locale, field) -> translated value
 */
@ObjectType({
    description: "Localized value for a specific Q&A field.",
})
@Entity("qna_translations")
@Index(
    "uq_qna_translation",
    [
        "qnaId",
        "locale",
        "field",
    ],
    {
        unique: true,
    },
)
export class QnaTranslationEntity extends UuidAbstractEntity {
    /**
     * Target Q&A ID.
     */
    @Field(
        () => String,
        {
            description: "Target Q&A ID.",
        },
    )
    @Column({
        name: "qna_id",
        type: "varchar",
        length: 255,
    })
        qnaId: string

    /**
     * Locale of the translation (e.g., vi, en).
     */
    @Field(() => GraphQLTypeLocale)
    @Column({
        name: "locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        locale: Locale

    /**
     * Target field name being translated (e.g., question, answer).
     */
    @Field(
        () => String,
        {
            description: "Target field name being translated.",
        },
    )
    @Column({
        name: "field",
        type: "varchar",
        length: 128,
    })
        field: string

    /**
     * Translated value for the field.
     */
    @Field(
        () => String,
        {
            description: "Translated value for the field.",
        },
    )
    @Column({
        name: "value",
        type: "text",
    })
        value: string

    /**
     * Reference to the parent Q&A.
     * Cascade delete ensures translations are removed when Q&A is deleted.
     */
    @ManyToOne(
        () => QnaEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "qna_id",
        referencedColumnName: "id",
    })
        qna: QnaEntity
}


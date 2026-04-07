import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "typeorm"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    AbstractEntity,
} from "./abstract"
import {
    QnaEntity,
} from "./qna.entity"

/**
 * Translation entity for Q&A fields.
 * Primary key: (qnaId, locale, field).
 */
@ObjectType({
    description: "Localized value for a specific Q&A field.",
})
@Entity("qna_translations")
export class QnaTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target Q&A ID.",
        },
    )
    @PrimaryColumn({
        name: "qna_id",
        type: "uuid",
    })
        qnaId: string

    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Locale of the translation (e.g. vi, en).",
        },
    )
    @PrimaryColumn({
        name: "locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        locale: Locale

    @Field(
        () => String,
        {
            description: "Target field name being translated.",
        },
    )
    @PrimaryColumn({
        name: "field",
        type: "varchar",
        length: 128,
    })
        field: string

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

    @ManyToOne(
        () => QnaEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "qna_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_qna_id_qna_translations_qnas",
    })
        qna: QnaEntity
}

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
    CodeExplainingEntity,
} from "./code-explaining.entity"

/**
 * Translation for code explaining fields (explain).
 * Primary key: (codeExplainingId, locale, field).
 */
@ObjectType({
    description: "Localized value for a code explaining field.",
})
@Entity("code_explaining_translations")
export class CodeExplainingTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target code explaining ID.",
        },
    )
    @PrimaryColumn({
        name: "code_explaining_id",
        type: "uuid",
    })
        codeExplainingId: string

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
        () => CodeExplainingEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "code_explaining_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_code_explaining_id_code_explaining_translations_code_explainings",
    })
        codeExplaining: CodeExplainingEntity
}

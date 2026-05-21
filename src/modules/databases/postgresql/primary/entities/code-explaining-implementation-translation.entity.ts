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
    CodeExplainingImplementationEntity,
} from "./code-explaining-implementation.entity"

/**
 * Translation for code explaining implementation fields (implementGuide).
 * Primary key: (codeExplainingImplementationId, locale, field).
 */
@ObjectType({
    description: "Localized value for a code explaining implementation field.",
})
@Entity("code_explaining_implementation_translations")
export class CodeExplainingImplementationTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target code explaining implementation ID.",
        },
    )
    @PrimaryColumn({
        name: "code_explaining_implementation_id",
        type: "uuid",
    })
        codeExplainingImplementationId: string

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
        () => CodeExplainingImplementationEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "code_explaining_implementation_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_code_explaining_impl_id_code_explaining_impl_translations_code_explaining_impls",
    })
        codeExplainingImplementation: CodeExplainingImplementationEntity
}

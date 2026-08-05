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
    CodeImplementationEntity,
} from "./code-implementation.entity"

@ObjectType({
    description: "Localized value for a code implementation field.",
})
@Entity("code_implementation_translations")
/**
 * Translation for {@link CodeImplementationEntity} fields (`guide`, `example`).
 */
export class CodeImplementationTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target code implementation ID.",
        },
    )
    @PrimaryColumn({
        name: "code_implementation_id",
        type: "uuid",
    })
        codeImplementationId: string

    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Locale of the translation.",
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
            description: "Target field name (`guide` or `example`).",
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
        () => CodeImplementationEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "code_implementation_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_code_impl_id_code_impl_translations_code_implementations",
    })
        codeImplementation: CodeImplementationEntity
}

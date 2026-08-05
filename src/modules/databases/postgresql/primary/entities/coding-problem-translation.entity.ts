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
    CodingProblemEntity,
} from "./coding-problem.entity"

@ObjectType({
    description: "Localized value for a coding-problem field (title or statement).",
})
@Entity("coding_problem_translations")
/**
 * Per-locale override for a translatable coding-problem field (`title` or
 * `statement`). Composite primary key: (codingProblemId, locale, field).
 */
export class CodingProblemTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target coding problem ID.",
        },
    )
    @PrimaryColumn({
        name: "coding_problem_id",
        type: "uuid",
    })
        codingProblemId: string

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
            description: "Target field name being translated (`title` or `statement`).",
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
        () => CodingProblemEntity,
        (problem: CodingProblemEntity) => problem.translations,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "coding_problem_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_coding_problem_id_coding_problem_translations_coding_problems",
    })
        problem: CodingProblemEntity
}

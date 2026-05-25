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
    ChallengeStepCodeImplementationEntity,
} from "./challenge-step-code-implementation.entity"

/**
 * Translation for {@link ChallengeStepCodeImplementationEntity} (`guide`, `example`).
 */
@ObjectType({
    description: "Localized value for a challenge step code implementation field.",
})
@Entity("challenge_step_code_implementation_translations")
export class ChallengeStepCodeImplementationTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target implementation row ID.",
        },
    )
    @PrimaryColumn({
        name: "challenge_step_code_implementation_id",
        type: "uuid",
    })
        challengeStepCodeImplementationId: string

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
            description: "Translated value.",
        },
    )
    @Column({
        name: "value",
        type: "text",
    })
        value: string

    @ManyToOne(
        () => ChallengeStepCodeImplementationEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_step_code_implementation_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_step_code_impl_id_step_code_impl_translations_step_code_impls",
    })
        challengeStepCodeImplementation: ChallengeStepCodeImplementationEntity
}

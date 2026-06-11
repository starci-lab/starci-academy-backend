import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    ChallengeStepEntity,
} from "./challenge-step.entity"
import {
    ChallengeStepCodeImplementationTranslationEntity,
} from "./challenge-step-code-implementation-translation.entity"

/**
 * Multi-language implementation guide nested under a challenge step (`### codeImplementations`).
 */
@ObjectType({
    description: "Implementation guide for a challenge step in a specific programming language.",
})
@Entity("challenge_step_code_implementations")
export class ChallengeStepCodeImplementationEntity extends UuidAbstractEntity {
    @Field(
        () => String,
        {
            description: "Programming language (e.g. csharp, go, java).",
        },
    )
    @Column({
        name: "lang",
        type: "varchar",
        length: 64,
    })
        lang: string

    @Field(
        () => String,
        {
            description: "Mapping guide prose (Markdown).",
        },
    )
    @Column({
        name: "guide",
        type: "text",
    })
        guide: string

    @Field(
        () => String,
        {
            description: "Example code block (Markdown).",
        },
    )
    @Column({
        name: "example",
        type: "text",
    })
        example: string

    @Field(
        () => Int,
        {
            description: "Display order within the step implementation list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    @Field(
        () => Int,
        {
            description: "Pure ordering index used to reorder the list (decoupled from orderIndex).",
        },
    )
    @Column({
        name: "sort_index",
        type: "int",
        default: 0,
    })
        sortIndex: number

    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this row.",
        },
    )
    @Column({
        name: "default_locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        defaultLocale: Locale

    @Field(
        () => ChallengeStepEntity,
        {
            description: "Parent challenge step.",
        },
    )
    @ManyToOne(
        () => ChallengeStepEntity,
        (step: ChallengeStepEntity) => step.codeImplementations,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_step_id",
        foreignKeyConstraintName:
            "fk_challenge_step_id_challenge_step_code_impls_challenge_steps",
    })
        challengeStep: ChallengeStepEntity

    @Field(
        () => ID,
        {
            description: "Parent challenge step ID.",
        },
    )
    @RelationId(
        (row: ChallengeStepCodeImplementationEntity) => row.challengeStep,
    )
        challengeStepId: string

    @Field(
        () => [ChallengeStepCodeImplementationTranslationEntity],
        {
            description: "Localized overrides for guide and example.",
        },
    )
    @OneToMany(
        () => ChallengeStepCodeImplementationTranslationEntity,
        (translation: ChallengeStepCodeImplementationTranslationEntity) =>
            translation.challengeStepCodeImplementation,
        {
            cascade: true,
        },
    )
        translations: Array<ChallengeStepCodeImplementationTranslationEntity>
}

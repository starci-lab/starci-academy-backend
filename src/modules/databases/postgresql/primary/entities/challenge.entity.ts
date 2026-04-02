import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    ChallengeDifficulty,
    GraphQLTypeChallengeDifficulty,
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    ModuleEntity,
} from "./module.entity"
import {
    ChallengeTranslationEntity,
} from "./challenge-translation.entity"
import {
    ChallengeInputEntity,
} from "./challenge-input.entity"
import {
    ChallengeReferenceEntity,
} from "./challenge-reference.entity"
import {
    ChallengeStepEntity,
} from "./challenge-step.entity"

/**
 * Hands-on challenge attached to a module (title, brief, description, ordered inputs).
 */
@ObjectType({
    description: "Challenge attached to a module with localized copy and inputs.",
})
@Entity("challenges")
export class ChallengeEntity extends UuidAbstractEntity {
    /**
     * Challenge title.
     */
    @Field(
        () => String,
        {
            description: "Challenge title.",
        },
    )
    @Column({
        name: "title",
        type: "varchar",
        length: 500,
    })
        title: string

    /**
     * Short summary in Markdown, shown before the full description.
     */
    @Field(
        () => String,
        {
            description: "Short challenge brief (Markdown).",
        },
    )
    @Column({
        name: "brief",
        type: "text",
    })
        brief: string

    /**
     * Full challenge description (e.g. instructions, markdown).
     */
    @Field(
        () => String,
        {
            description: "Full challenge description (Markdown supported).",
        },
    )
    @Column({
        name: "description",
        type: "text",
    })
        description: string

    /**
     * Points awarded when the challenge is completed successfully.
     */
    @Field(
        () => Int,
        {
            description: "Score / points for completing this challenge.",
        },
    )
    @Column({
        name: "score",
        type: "int",
        default: 0,
    })
        score: number

    /**
     * Relative difficulty.
     */
    @Field(
        () => GraphQLTypeChallengeDifficulty,
        {
            description: "Relative difficulty of the challenge (optional).",
        },
    )
    @Column({
        name: "difficulty",
        type: "enum",
        enum: ChallengeDifficulty,
        enumName: "challenge_difficulty",
    })
        difficulty: ChallengeDifficulty

    /**
     * Optional thumbnail image URL for the challenge card.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional thumbnail image URL.",
        },
    )
    @Column({
        name: "thumbnail_url",
        type: "varchar",
        length: 2048,
        nullable: true,
    })
        thumbnailUrl: string | null

    /**
     * Display order within the module challenge list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the module challenge list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /**
     * Default locale for this challenge row.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this challenge row.",
        },
    )
    @Column({
        name: "default_locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        defaultLocale: Locale

    /**
     * Parent module.
     */
    @Field(
        () => ModuleEntity,
        {
            description: "Parent module this challenge belongs to.",
        },
    )
    @ManyToOne(
        () => ModuleEntity,
        (module: ModuleEntity) => module.challenges,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "module_id",
    })
        module: ModuleEntity

    /**
     * Ordered inputs for this challenge.
     */
    @Field(
        () => [ChallengeInputEntity],
        {
            description: "Ordered inputs belonging to this challenge.",
        },
    )
    @OneToMany(
        () => ChallengeInputEntity,
        (input: ChallengeInputEntity) => input.challenge,
        {
            cascade: true,
        },
    )
        inputs: Array<ChallengeInputEntity>

    /**
     * Ordered instruction steps.
     */
    @Field(
        () => [ChallengeStepEntity],
        {
            description: "Ordered steps (title + description) for this challenge.",
        },
    )
    @OneToMany(
        () => ChallengeStepEntity,
        (step: ChallengeStepEntity) => step.challenge,
        {
            cascade: true,
        },
    )
        steps: Array<ChallengeStepEntity>

    /**
     * External URL references (docs, repos, etc.).
     */
    @Field(
        () => [ChallengeReferenceEntity],
        {
            description: "External URL references linked to this challenge.",
        },
    )
    @OneToMany(
        () => ChallengeReferenceEntity,
        (reference: ChallengeReferenceEntity) => reference.challenge,
        {
            cascade: true,
        },
    )
        references: Array<ChallengeReferenceEntity>

    /**
     * Localized overrides for title, brief, and description.
     */
    @Field(
        () => [ChallengeTranslationEntity],
        {
            description: "Localized overrides for challenge fields (title, brief, description); brief/description accept Markdown.",
        },
    )
    @OneToMany(
        () => ChallengeTranslationEntity,
        (translation: ChallengeTranslationEntity) => translation.challenge,
        {
            cascade: true,
        },
    )
        translations: Array<ChallengeTranslationEntity>
}

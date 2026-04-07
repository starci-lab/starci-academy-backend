import {
    Field,
    ID,
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
    RelationId,
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
    ChallengeReferenceEntity,
} from "./challenge-reference.entity"
import {
    ChallengeStepEntity,
} from "./challenge-step.entity"
import {
    ChallengeSubmissionEntity,
} from "./challenge-submission.entity"

/**
 * Hands-on challenge attached to a module (title, prerequisites, description, steps, references).
 */
@ObjectType({
    description: "Challenge attached to a module with localized copy, steps, and references.",
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
     * Human-facing stable identifier from the mount folder (`{index}-{slug}` slug segment).
     */
    @Field(
        () => String,
        {
            description: "Human-facing stable identifier from the challenge mount folder slug.",
        },
    )
    @Column({
        name: "display_id",
        type: "varchar",
        length: 255,
    })
        displayId: string

    /**
     * Challenge prerequisites (Markdown).
     */
    @Field(
        () => String,
        {
            description: "Challenge prerequisites (Markdown).",
        },
    )
    @Column({
        name: "prerequisites",
        type: "text",
        default: "",
    })
        prerequisites: string

    /**
     * Challenge description.
     */
    @Field(
        () => String,
        {
            description: "Challenge description.",
        },
    )
    @Column({
        name: "description",
        type: "text",
        default: "",
    })
        description: string

    /**
     * Challenge requirements (e.g. instructions, markdown).
     */
    @Field(
        () => String,
        {
            description: "Challenge requirements (Markdown).",
        },
    )
    @Column({
        name: "requirements",
        type: "text",
        default: "",
    })
        requirements: string

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
        foreignKeyConstraintName: "fk_module_id_challenges_modules",
    })
        module: ModuleEntity

    @Field(
        () => ID,
        {
            description: "Parent module ID.",
        },
    )
    @RelationId(
        (ch: ChallengeEntity) => ch.module,
    )
        moduleId: string

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

    @Field(
        () => [ChallengeSubmissionEntity],
        {
            nullable: true,
            description: "Submission definitions attached to this challenge.",
        },
    )
    @OneToMany(
        () => ChallengeSubmissionEntity,
        (submission: ChallengeSubmissionEntity) => submission.challenge,
        {
            cascade: true,
        },
    )
        submissions: Array<ChallengeSubmissionEntity>
}

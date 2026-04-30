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
    ContentEntity,
} from "./content.entity"
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
import {
    ChallengeRequirementEntity,
} from "./challenge-requirement.entity"
import {
    ChallengeOutputEntity,
} from "./challenge-output.entity"
import {
    ChallengePrerequisiteEntity,
} from "./challenge-prerequisite.entity"

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

    @Field(
        () => String,
        {
            description: "Challenge requirements rendered from requirement items (Markdown).",
        },
    )
        requirements: string

    @Field(
        () => String,
        {
            description: "Challenge outputs rendered from output items (Markdown).",
            nullable: true,
        },
    )
        outputs?: string

    output?: string

    @Field(
        () => String,
        {
            description: "Challenge prerequisites rendered from prerequisite items (Markdown).",
        },
    )
        prerequisites: string

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
        () => [ChallengeRequirementEntity],
        {
            description: "Ordered markdown requirement items.",
        },
    )
    @OneToMany(
        () => ChallengeRequirementEntity,
        (challengeRequirement: ChallengeRequirementEntity) => challengeRequirement.challenge,
        {
            cascade: true,
        },
    )
        challengeRequirements: Array<ChallengeRequirementEntity>

    @Field(
        () => [ChallengeOutputEntity],
        {
            description: "Ordered markdown output items.",
        },
    )
    @OneToMany(
        () => ChallengeOutputEntity,
        (challengeOutput: ChallengeOutputEntity) => challengeOutput.challenge,
        {
            cascade: true,
        },
    )
        challengeOutputs: Array<ChallengeOutputEntity>

    @Field(
        () => [ChallengePrerequisiteEntity],
        {
            description: "Ordered markdown prerequisite items.",
        },
    )
    @OneToMany(
        () => ChallengePrerequisiteEntity,
        (challengePrerequisite: ChallengePrerequisiteEntity) => challengePrerequisite.challenge,
        {
            cascade: true,
        },
    )
        challengePrerequisites: Array<ChallengePrerequisiteEntity>

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

    /**
     * Optional hint text (Markdown) to nudge the student without revealing the full solution.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional hint (Markdown) for the challenge.",
        },
    )
    @Column({
        name: "hint",
        type: "text",
        nullable: true,
    })
        hint: string | null

    /**
     * Optional parent content this challenge is derived from.
     */
    @Field(
        () => ContentEntity,
        {
            nullable: true,
            description: "Optional content this challenge is associated with.",
        },
    )
    @ManyToOne(
        () => ContentEntity,
        (content: ContentEntity) => content.challenges,
        {
            onDelete: "SET NULL",
            nullable: true,
        },
    )
    @JoinColumn({
        name: "content_id",
        foreignKeyConstraintName: "fk_content_id_challenges_contents",
    })
        content: ContentEntity

    @Field(
        () => ID,
        {
            nullable: true,
            description: "Optional parent content ID.",
        },
    )
    @RelationId(
        (challenge: ChallengeEntity) => challenge.content,
    )
        contentId: string

}

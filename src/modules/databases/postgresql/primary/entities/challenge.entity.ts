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
    ChallengeSubmissionEntity,
} from "./challenge-submission.entity"
import {
    ChallengeRequirementEntity,
} from "./challenge-requirement.entity"
import {
    ChallengeStepEntity,
} from "./challenge-step.entity"
import {
    ChallengeOutputEntity,
} from "./challenge-output.entity"
import {
    ChallengePrerequisiteEntity,
} from "./challenge-prerequisite.entity"

/**
 * Hands-on challenge attached to a module (title, prerequisites, description, steps).
 */
@ObjectType({
    description: "Challenge attached to a module with localized copy and steps.",
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
     * Pure ordering index used to reorder the challenge list (decoupled from orderIndex).
     */
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

    /**
     * SCHEMA V2 per-language requirement buckets (locales embedded in jsonb payload).
     */
    @Field(
        () => [ChallengeRequirementEntity],
        {
            description: "Per-language requirement buckets (V2); locales embedded in jsonb.",
        },
    )
    @OneToMany(
        () => ChallengeRequirementEntity,
        (requirement: ChallengeRequirementEntity) => requirement.challenge,
        {
            cascade: true,
        },
    )
        requirements: Array<ChallengeRequirementEntity>

    /**
     * SCHEMA V2 per-language step buckets (locales embedded in jsonb payload).
     */
    @Field(
        () => [ChallengeStepEntity],
        {
            description: "Per-language step buckets (V2); locales embedded in jsonb.",
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
     * SCHEMA V2 per-language output buckets (locales embedded in jsonb payload).
     */
    @Field(
        () => [ChallengeOutputEntity],
        {
            description: "Per-language output buckets (V2); locales embedded in jsonb.",
        },
    )
    @OneToMany(
        () => ChallengeOutputEntity,
        (output: ChallengeOutputEntity) => output.challenge,
        {
            cascade: true,
        },
    )
        outputs: Array<ChallengeOutputEntity>

    /**
     * SCHEMA V2 per-language prerequisite buckets (locales embedded in jsonb payload).
     */
    @Field(
        () => [ChallengePrerequisiteEntity],
        {
            description: "Per-language prerequisite buckets (V2); locales embedded in jsonb.",
        },
    )
    @OneToMany(
        () => ChallengePrerequisiteEntity,
        (prerequisite: ChallengePrerequisiteEntity) => prerequisite.challenge,
        {
            cascade: true,
        },
    )
        prerequisites: Array<ChallengePrerequisiteEntity>

    /**
     * Outcome grading criteria (language-agnostic yes/no items) stored as jsonb. INTERNAL grading
     * rubric — deliberately NOT a `@Field`, so it is never exposed through GraphQL to the learner.
     */
    @Column({
        name: "outcome_criteria",
        type: "jsonb",
        nullable: true,
    })
        outcomeCriteria: Array<Record<string, unknown>> | null

    /**
     * Approach grading criteria (per-language yes/no items) stored as jsonb. INTERNAL grading
     * rubric — deliberately NOT a `@Field`, so it is never exposed through GraphQL to the learner.
     */
    @Column({
        name: "approach_criteria",
        type: "jsonb",
        nullable: true,
    })
        approachCriteria: Array<Record<string, unknown>> | null

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
     * Day this challenge was verified/audited. Presence (non-null) marks a SCHEMA V2 challenge;
     * legacy challenges leave it null. Sourced from the `# verified` markdown heading.
     */
    @Field(
        () => Date,
        {
            nullable: true,
            description: "Day this challenge was verified; non-null marks a SCHEMA V2 challenge.",
        },
    )
    @Column({
        name: "verified",
        type: "timestamptz",
        nullable: true,
    })
        verified: Date | null

    /**
     * Parent content this challenge belongs to.
     */
    @Field(
        () => ContentEntity,
        {
            description: "Content this challenge is associated with.",
        },
    )
    @ManyToOne(
        () => ContentEntity,
        (content: ContentEntity) => content.challenges,
        {
            onDelete: "CASCADE",
            nullable: false,
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
            description: "Parent content ID.",
        },
    )
    @RelationId(
        (challenge: ChallengeEntity) => challenge.content,
    )
        contentId: string

    /**
     * The content-AI conversation the learner last used on this challenge's
     * surface, so the FE can resume the remembered chat instead of starting a
     * fresh one. Nullable — set once a `content-ai session` (scope = `challenge`)
     * exists for this challenge; never set at seed time.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "The content-AI conversation the learner last used on this challenge (for resume); null until one exists.",
        },
    )
    @Column({
        name: "content_ai_session_id",
        type: "uuid",
        nullable: true,
    })
        contentAiSessionId: string | null

}

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
    ChallengeEntity,
} from "./challenge.entity"
import {
    ChallengeStepTranslationEntity,
} from "./challenge-step-translation.entity"

/**
 * Ordered instruction step within a challenge (optional short description + Markdown body).
 */
@ObjectType({
    description: "Challenge step: title, optional short description, and Markdown body.",
})
@Entity("challenge_steps")
export class ChallengeStepEntity extends UuidAbstractEntity {
    @Field(
        () => String,
        {
            description: "Step title or heading.",
        },
    )
    @Column({
        name: "title",
        type: "varchar",
        length: 500,
    })
        title: string

    /**
     * Main step content as Markdown.
     */
    @Field(
        () => String,
        {
            description: "Step content as Markdown.",
        },
    )
    @Column({
        name: "body",
        type: "text",
    })
        body: string

    @Field(
        () => Int,
        {
            description: "Display order within the challenge step list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this step row.",
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
        () => ChallengeEntity,
        {
            description: "Parent challenge.",
        },
    )
    @ManyToOne(
        () => ChallengeEntity,
        (challenge: ChallengeEntity) => challenge.steps,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_id",
        foreignKeyConstraintName:
            "fk_challenge_id_challenge_steps_challenges",
    })
        challenge: ChallengeEntity

    @Field(
        () => ID,
        {
            description: "Parent challenge ID.",
        },
    )
    @RelationId(
        (step: ChallengeStepEntity) => step.challenge,
    )
        challengeId: string

    @Field(
        () => [ChallengeStepTranslationEntity],
        {
            description: "Localized overrides for step fields (title, description, body).",
        },
    )
    @OneToMany(
        () => ChallengeStepTranslationEntity,
        (translation: ChallengeStepTranslationEntity) => translation.challengeStep,
        {
            cascade: true,
        },
    )
        translations: Array<ChallengeStepTranslationEntity>
}

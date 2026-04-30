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
    ChallengeRequirementTranslationEntity,
} from "./challenge-requirement-translation.entity"

@ObjectType({
    description: "Markdown requirement item belonging to a challenge.",
})
@Entity("challenge_requirements")
export class ChallengeRequirementEntity extends UuidAbstractEntity {
    @Field(
        () => String,
        {
            description: "Markdown text rendered for this requirement item.",
        },
    )
    @Column({
        name: "text",
        type: "text",
    })
        text: string

    @Field(
        () => Int,
        {
            description: "Display order within challenge requirement list.",
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
            description: "Default locale for this requirement row.",
        },
    )
    @Column({
        name: "default_locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        defaultLocale: Locale

    @ManyToOne(
        () => ChallengeEntity,
        (challenge: ChallengeEntity) => challenge.challengeRequirements,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_id",
        foreignKeyConstraintName: "fk_challenge_id_challenge_requirements_challenges",
    })
        challenge: ChallengeEntity

    @Field(
        () => ID,
        {
            description: "Parent challenge ID.",
        },
    )
    @RelationId(
        (challengeRequirement: ChallengeRequirementEntity) => challengeRequirement.challenge,
    )
        challengeId: string

    @Field(
        () => [ChallengeRequirementTranslationEntity],
        {
            description: "Localized requirement text values.",
        },
    )
    @OneToMany(
        () => ChallengeRequirementTranslationEntity,
        (translation: ChallengeRequirementTranslationEntity) => translation.challengeRequirement,
        {
            cascade: true,
        },
    )
        translations: Array<ChallengeRequirementTranslationEntity>
}

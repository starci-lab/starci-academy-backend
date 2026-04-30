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
    ChallengePrerequisiteTranslationEntity,
} from "./challenge-prerequisite-translation.entity"

@ObjectType({
    description: "Markdown prerequisite item belonging to a challenge.",
})
@Entity("challenge_prerequisites")
export class ChallengePrerequisiteEntity extends UuidAbstractEntity {
    @Field(() => String)
    @Column({
        name: "text",
        type: "text",
    })
        text: string

    @Field(() => Int)
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    @Field(() => GraphQLTypeLocale)
    @Column({
        name: "default_locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        defaultLocale: Locale

    @ManyToOne(
        () => ChallengeEntity,
        (challenge: ChallengeEntity) => challenge.challengePrerequisites,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_id",
        foreignKeyConstraintName: "fk_challenge_id_challenge_prerequisites_challenges",
    })
        challenge: ChallengeEntity

    @Field(() => ID)
    @RelationId((challengePrerequisite: ChallengePrerequisiteEntity) => challengePrerequisite.challenge)
        challengeId: string

    @Field(() => [ChallengePrerequisiteTranslationEntity])
    @OneToMany(
        () => ChallengePrerequisiteTranslationEntity,
        (translation: ChallengePrerequisiteTranslationEntity) => translation.challengePrerequisite,
        {
            cascade: true,
        },
    )
        translations: Array<ChallengePrerequisiteTranslationEntity>
}

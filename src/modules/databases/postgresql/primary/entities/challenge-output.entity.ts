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
    ChallengeOutputTranslationEntity,
} from "./challenge-output-translation.entity"

@ObjectType({
    description: "Markdown output item belonging to a challenge.",
})
@Entity("challenge_outputs")
export class ChallengeOutputEntity extends UuidAbstractEntity {
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
        (challenge: ChallengeEntity) => challenge.challengeOutputs,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_id",
        foreignKeyConstraintName: "fk_challenge_id_challenge_outputs_challenges",
    })
        challenge: ChallengeEntity

    @Field(() => ID)
    @RelationId((challengeOutput: ChallengeOutputEntity) => challengeOutput.challenge)
        challengeId: string

    @Field(() => [ChallengeOutputTranslationEntity])
    @OneToMany(
        () => ChallengeOutputTranslationEntity,
        (translation: ChallengeOutputTranslationEntity) => translation.challengeOutput,
        {
            cascade: true,
        },
    )
        translations: Array<ChallengeOutputTranslationEntity>
}

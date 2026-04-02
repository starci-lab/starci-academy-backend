import {
    Field,
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
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    ChallengeEntity,
} from "./challenge.entity"
import {
    ChallengeInputTranslationEntity,
} from "./challenge-input-translation.entity"

/**
 * A single input line item for a module challenge (e.g. expected answer hint).
 */
@ObjectType({
    description: "Input row belonging to a module challenge.",
})
@Entity("challenge_inputs")
export class ChallengeInputEntity extends UuidAbstractEntity {
    /**
     * Description or prompt for this input (default locale).
     */
    @Field(
        () => String,
        {
            description: "Description or prompt for this input.",
        },
    )
    @Column({
        name: "description",
        type: "text",
    })
        description: string

    /**
     * Display order within the challenge input list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the challenge input list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /**
     * Default locale for this input row.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this input row.",
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
     * Parent challenge.
     */
    @Field(
        () => ChallengeEntity,
        {
            description: "Parent challenge.",
        },
    )
    @ManyToOne(
        () => ChallengeEntity,
        (challenge: ChallengeEntity) => challenge.inputs,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_id",
    })
        challenge: ChallengeEntity

    /**
     * Localized overrides for fields such as `description`.
     */
    @Field(
        () => [ChallengeInputTranslationEntity],
        {
            description: "Localized overrides for input fields (e.g. description).",
        },
    )
    @OneToMany(
        () => ChallengeInputTranslationEntity,
        (translation: ChallengeInputTranslationEntity) => translation.challengeInput,
        {
            cascade: true,
        },
    )
        translations: Array<ChallengeInputTranslationEntity>
}

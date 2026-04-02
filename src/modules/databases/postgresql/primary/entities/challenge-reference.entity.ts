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
    ChallengeReferenceTranslationEntity,
} from "./challenge-reference-translation.entity"

/**
 * External URL reference attached to a challenge (e.g. docs).
 */
@ObjectType({
    description: "External URL reference attached to a challenge.",
})
@Entity("challenge_references")
export class ChallengeReferenceEntity extends UuidAbstractEntity {
    @Field(
        () => String,
        {
            nullable: true,
            description: "Human-readable link label; localized via translations (`field`: alias).",
        },
    )
    @Column({
        name: "alias",
        type: "varchar",
        length: 255,
        nullable: true,
    })
        alias: string | null

    @Field(
        () => String,
        {
            description: "Target URL (not localized).",
        },
    )
    @Column({
        name: "url",
        type: "varchar",
        length: 2048,
    })
        url: string

    @Field(
        () => Int,
        {
            description: "Display order within the challenge reference list.",
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
            description: "Default locale for this reference row.",
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
        (challenge: ChallengeEntity) => challenge.references,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_id",
    })
        challenge: ChallengeEntity

    @Field(
        () => [ChallengeReferenceTranslationEntity],
        {
            description: "Localized overrides for the reference alias (`field`: alias).",
        },
    )
    @OneToMany(
        () => ChallengeReferenceTranslationEntity,
        (translation: ChallengeReferenceTranslationEntity) => translation.challengeReference,
        {
            cascade: true,
        },
    )
        translations: Array<ChallengeReferenceTranslationEntity>
}

import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    RelationId,
} from "typeorm"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    ChallengeStepV2Entity,
} from "./challenge-step-v2.entity"
import {
    ChallengeStepV2LangTranslationEntity,
} from "./challenge-step-v2-lang-translation.entity"

/**
 * Per-programming-language row of a SCHEMA V2 step item. The localized `body` lives in
 * {@link ChallengeStepV2LangTranslationEntity}.
 */
@ObjectType({
    description: "Per-language row of a V2 step item (localized body lives in translations).",
})
@Entity("challenge_step_v2_langs")
export class ChallengeStepV2LangEntity extends UuidAbstractEntity {
    /**
     * Programming language (e.g. typescript, java, csharp, go).
     */
    @Field(
        () => String,
        {
            description: "Programming language for this step content.",
        },
    )
    @Column({
        name: "lang",
        type: "varchar",
        length: 32,
    })
        lang: string

    /**
     * Default locale for this language row.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this language row.",
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
     * Parent step item this language content belongs to.
     */
    @ManyToOne(
        () => ChallengeStepV2Entity,
        (stepV2: ChallengeStepV2Entity) => stepV2.langs,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_step_v2_id",
        foreignKeyConstraintName: "fk_step_v2_lang_challenge_steps_v2",
    })
        stepV2: ChallengeStepV2Entity

    /**
     * Parent step item ID.
     */
    @Field(
        () => ID,
        {
            description: "Parent step item ID.",
        },
    )
    @RelationId(
        (lang: ChallengeStepV2LangEntity) => lang.stepV2,
    )
        stepV2Id: string

    /**
     * Per-locale body overrides for this language content.
     */
    @Field(
        () => [ChallengeStepV2LangTranslationEntity],
        {
            description: "Per-locale body overrides for this language content.",
        },
    )
    @OneToMany(
        () => ChallengeStepV2LangTranslationEntity,
        (translation: ChallengeStepV2LangTranslationEntity) => translation.lang,
        {
            cascade: true,
            orphanedRowAction: "delete",
        },
    )
        translations: Array<ChallengeStepV2LangTranslationEntity>
}

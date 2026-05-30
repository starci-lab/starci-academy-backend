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
    ChallengeOutputV2Entity,
} from "./challenge-output-v2.entity"
import {
    ChallengeOutputV2LangTranslationEntity,
} from "./challenge-output-v2-lang-translation.entity"

/**
 * Per-programming-language row of a SCHEMA V2 output item. The localized `body` lives in
 * {@link ChallengeOutputV2LangTranslationEntity}.
 */
@ObjectType({
    description: "Per-language row of a V2 output item (localized body lives in translations).",
})
@Entity("challenge_output_v2_langs")
export class ChallengeOutputV2LangEntity extends UuidAbstractEntity {
    /**
     * Programming language (e.g. typescript, java, csharp, go).
     */
    @Field(
        () => String,
        {
            description: "Programming language for this output content.",
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
     * Parent output item this language content belongs to.
     */
    @ManyToOne(
        () => ChallengeOutputV2Entity,
        (outputV2: ChallengeOutputV2Entity) => outputV2.langs,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_output_v2_id",
        foreignKeyConstraintName: "fk_output_v2_lang_challenge_outputs_v2",
    })
        outputV2: ChallengeOutputV2Entity

    /**
     * Parent output item ID.
     */
    @Field(
        () => ID,
        {
            description: "Parent output item ID.",
        },
    )
    @RelationId(
        (lang: ChallengeOutputV2LangEntity) => lang.outputV2,
    )
        outputV2Id: string

    /**
     * Per-locale body overrides for this language content.
     */
    @Field(
        () => [ChallengeOutputV2LangTranslationEntity],
        {
            description: "Per-locale body overrides for this language content.",
        },
    )
    @OneToMany(
        () => ChallengeOutputV2LangTranslationEntity,
        (translation: ChallengeOutputV2LangTranslationEntity) => translation.lang,
        {
            cascade: true,
            orphanedRowAction: "delete",
        },
    )
        translations: Array<ChallengeOutputV2LangTranslationEntity>
}

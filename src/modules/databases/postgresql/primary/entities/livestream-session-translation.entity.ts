import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "typeorm"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    AbstractEntity,
} from "./abstract"
import {
    LivestreamSessionEntity,
} from "./livestream-session.entity"

/**
 * Localized overrides for livestream session fields (e.g. note).
 * Primary key: (livestreamSessionId, locale, field).
 */
@ObjectType({
    description: "Localized value for a livestream session field.",
})
@Entity("livestream_session_translations")
export class LivestreamSessionTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target livestream session ID.",
        },
    )
    @PrimaryColumn({
        name: "livestream_session_id",
        type: "uuid",
    })
        livestreamSessionId: string

    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Locale of the translation (e.g. vi, en).",
        },
    )
    @PrimaryColumn({
        name: "locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        locale: Locale

    @Field(
        () => String,
        {
            description: "Target field name being translated.",
        },
    )
    @PrimaryColumn({
        name: "field",
        type: "varchar",
        length: 128,
    })
        field: string

    @Field(
        () => String,
        {
            description: "Translated value for the field.",
        },
    )
    @Column({
        name: "value",
        type: "text",
    })
        value: string

    @ManyToOne(
        () => LivestreamSessionEntity,
        (session: LivestreamSessionEntity) => session.translations,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "livestream_session_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_livestream_session_id_livestream_session_translations_livestream_sessions",
    })
        livestreamSession: LivestreamSessionEntity
}

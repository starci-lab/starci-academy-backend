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
    ContentBodyEntity,
} from "./content-body.entity"

@ObjectType({
    description: "Localized lesson body for a content body bucket.",
})
@Entity("content_body_translations")
/**
 * Localized lesson body for a SCHEMA V2 content body bucket. One row per (body × locale).
 */
export class ContentBodyTranslationEntity extends AbstractEntity {
    /**
     * Parent content body id (composite PK part).
     */
    @Field(() => String)
    @PrimaryColumn({
        name: "content_body_id",
        type: "uuid",
    })
        contentBodyId: string

    /**
     * Locale of this body (composite PK part).
     */
    @Field(() => GraphQLTypeLocale)
    @PrimaryColumn({
        name: "locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        locale: Locale

    /**
     * Localized lesson body (Markdown) for this locale.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Localized lesson body (Markdown) for this locale.",
        },
    )
    @Column({
        name: "body",
        type: "text",
        nullable: true,
    })
        body: string | null

    /**
     * Parent content body bucket this translation belongs to.
     */
    @ManyToOne(
        () => ContentBodyEntity,
        (contentBody: ContentBodyEntity) => contentBody.translations,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "content_body_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_content_body_id_content_body_translations",
    })
        contentBody: ContentBodyEntity
}

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
    ContentBodyV2Entity,
} from "./content-body-v2.entity"

/**
 * Localized lesson body for a SCHEMA V2 content body bucket. One row per (body × locale); mirrors
 * the V2 challenge translation pattern (composite PK + single value column).
 */
@ObjectType({
    description: "Localized lesson body for a V2 content body bucket.",
})
@Entity("content_body_v2_translations")
export class ContentBodyV2TranslationEntity extends AbstractEntity {
    /**
     * Parent V2 content body id (composite PK part).
     */
    @Field(() => String)
    @PrimaryColumn({
        name: "content_body_v2_id",
        type: "uuid",
    })
        contentBodyV2Id: string

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
     * Parent V2 content body bucket this translation belongs to.
     */
    @ManyToOne(
        () => ContentBodyV2Entity,
        (contentBodyV2: ContentBodyV2Entity) => contentBodyV2.translations,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "content_body_v2_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_content_body_v2_id_content_body_v2_translations",
    })
        contentBodyV2: ContentBodyV2Entity
}

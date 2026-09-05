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
} from "../enums/locale"
import {
    AbstractEntity,
} from "./abstract"
import {
    ConceptSectionEntity,
} from "./concept-section.entity"
import type {
    ConceptActivity,
} from "@modules/init/seeders/concepts/types"

@ObjectType({
    description: "Localized visible copy for a concept section.",
})
@Entity("concept_section_translations")
/** Localized section text plus internal assessment metadata. */
export class ConceptSectionTranslationEntity extends AbstractEntity {
    @Field(() => String)
    @PrimaryColumn({
        name: "concept_section_id", type: "uuid",
    })
        conceptSectionId: string

    @Field(() => GraphQLTypeLocale)
    @PrimaryColumn({
        name: "locale", type: "enum", enum: Locale, enumName: "locale",
    })
        locale: Locale

    @Field(() => String)
    @Column({
        name: "title", type: "varchar", length: 500,
    })
        title: string

    @Field(() => String)
    @Column({
        name: "body", type: "text",
    })
        body: string

    /** Localized answers/rubrics stay internal until an explicit gated API owns them. */
    @Column({
        name: "activities", type: "jsonb", nullable: true,
    })
        activities: Array<ConceptActivity> | null

    @ManyToOne(
        () => ConceptSectionEntity,
        (section: ConceptSectionEntity) => section.translations,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "concept_section_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_concept_section_id_concept_section_translations_sections",
    })
        section: ConceptSectionEntity
}

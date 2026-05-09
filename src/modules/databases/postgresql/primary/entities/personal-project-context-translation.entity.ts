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
    PersonalProjectContextEntity,
} from "./personal-project-context.entity"

/**
 * Localized content for a personal project context entry.
 * Primary key: (personalProjectContextId, locale).
 */
@ObjectType({
    description: "Localized content for a personal project context.",
})
@Entity("personal_project_context_translations")
export class PersonalProjectContextTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target personal project context ID.",
        },
    )
    @PrimaryColumn({
        name: "personal_project_context_id",
        type: "uuid",
    })
        personalProjectContextId: string

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

    /**
     * The localized content text (e.g. the full requirements or roadmap markdown).
     */
    @Field(
        () => String,
        {
            description: "Localized content text.",
        },
    )
    @Column({
        name: "content",
        type: "text",
    })
        content: string

    @ManyToOne(
        () => PersonalProjectContextEntity,
        (context: PersonalProjectContextEntity) => context.translations,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "personal_project_context_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_personal_project_context_id_personal_project_context_translations_personal_project_contexts",
    })
        personalProjectContext: PersonalProjectContextEntity
}

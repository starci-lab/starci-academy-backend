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
    AbstractEntity,
} from "./abstract"
import {
    ConsultantEntity,
} from "./consultant.entity"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"

@ObjectType({
    description: "Localized value for a consultant field.",
})
@Entity("consultant_translations")
/**
 * Locale-scoped override for one consultant display field. Same consultant row
 * can render Vi and En without duplicating the consultant; missing locale falls
 * back to the consultant's `defaultLocale`.
 */
export class ConsultantTranslationEntity extends AbstractEntity {
    @Field(() => String,
        {
            description: "Target consultant ID." 
        })
    @PrimaryColumn({
        name: "consultant_id", type: "uuid" 
    })
        consultantId: string

    @Field(() => GraphQLTypeLocale,
        {
            description: "Locale of the translation." 
        })
    @PrimaryColumn({
        name: "locale", type: "enum", enum: Locale, enumName: "locale" 
    })
        locale: Locale

    @Field(() => String,
        {
            description: "Translated field name." 
        })
    @PrimaryColumn({
        name: "field", type: "varchar", length: 128 
    })
        field: string

    @Field(() => String,
        {
            description: "Translated value." 
        })
    @Column({
        name: "value", type: "text" 
    })
        value: string

    @ManyToOne(() => ConsultantEntity,
        {
            onDelete: "CASCADE" 
        })
    @JoinColumn({
        name: "consultant_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_consultant_id_consultant_translations_consultants",
    })
        consultant: ConsultantEntity
}

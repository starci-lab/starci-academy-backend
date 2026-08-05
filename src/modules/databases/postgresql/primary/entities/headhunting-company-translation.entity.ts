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
    HeadhuntingCompanyEntity,
} from "./headhunting-company.entity"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums/locale"

@ObjectType({
    description: "Localized value for a headhunting company field.",
})
@Entity("headhunting_company_translations")
/**
 * Locale-scoped override for one headhunting-company display field. Lets the
 * same company render Vi/En without duplicating the company row.
 */
export class HeadhuntingCompanyTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target company ID.",
        },
    )
    @PrimaryColumn({
        name: "company_id",
        type: "uuid",
    })
        companyId: string

    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Locale of the translation.",
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
            description: "Translated field name.",
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
            description: "Translated value.",
        },
    )
    @Column({
        name: "value",
        type: "text",
    })
        value: string

    @ManyToOne(
        () => HeadhuntingCompanyEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "company_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_company_id_headhunting_company_translations_companies",
    })
        company: HeadhuntingCompanyEntity
}

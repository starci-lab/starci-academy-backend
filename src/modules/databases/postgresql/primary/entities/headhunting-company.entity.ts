import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    OneToMany,
} from "typeorm"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    HeadhuntingCompanyTranslationEntity,
} from "./headhunting-company-translation.entity"
import {
    ConsultantEntity,
} from "./consultant.entity"

/**
 * Recruitment company (e.g. Pegasi) that employs consultants.
 */
@ObjectType({
    description: "IT recruitment company profile.",
})
@Entity("headhunting_companies")
export class HeadhuntingCompanyEntity extends UuidAbstractEntity {
    @Field(
        () => String,
        {
            description: "Company display name.",
        },
    )
    @Column({
        name: "title",
        type: "varchar",
        length: 255,
    })
        title: string

    @Field(
        () => String,
        {
            description: "Stable slug for routing and mount references.",
        },
    )
    @Column({
        name: "display_id",
        type: "varchar",
        length: 255,
        unique: true,
    })
        displayId: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Short company description.",
        },
    )
    @Column({
        name: "description",
        type: "text",
        nullable: true,
    })
        description: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Public website URL.",
        },
    )
    @Column({
        name: "website_url",
        type: "varchar",
        length: 2048,
        nullable: true,
    })
        websiteUrl: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Company logo image URL.",
        },
    )
    @Column({
        name: "logo_url",
        type: "varchar",
        length: 2048,
        nullable: true,
    })
        logoUrl: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Office address.",
        },
    )
    @Column({
        name: "address",
        type: "text",
        nullable: true,
    })
        address: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Contact phone numbers.",
        },
    )
    @Column({
        name: "phone",
        type: "varchar",
        length: 512,
        nullable: true,
    })
        phone: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Contact email.",
        },
    )
    @Column({
        name: "email",
        type: "varchar",
        length: 255,
        nullable: true,
    })
        email: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Facebook page URL.",
        },
    )
    @Column({
        name: "facebook_url",
        type: "varchar",
        length: 2048,
        nullable: true,
    })
        facebookUrl: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "LinkedIn company page URL.",
        },
    )
    @Column({
        name: "linkedin_url",
        type: "varchar",
        length: 2048,
        nullable: true,
    })
        linkedinUrl: string | null

    @Field(
        () => Int,
        {
            description: "Display order in company lists.",
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
            description: "Default locale for company copy.",
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
        () => [HeadhuntingCompanyTranslationEntity],
        {
            description: "Localized company fields.",
        },
    )
    @OneToMany(
        () => HeadhuntingCompanyTranslationEntity,
        (translation: HeadhuntingCompanyTranslationEntity) => translation.company,
        {
            cascade: true,
        },
    )
        translations: Array<HeadhuntingCompanyTranslationEntity>

    @Field(
        () => [ConsultantEntity],
        {
            description: "Consultants employed at this company.",
        },
    )
    @OneToMany(
        () => ConsultantEntity,
        (consultant: ConsultantEntity) => consultant.company,
        {
            cascade: true,
        },
    )
        consultants: Array<ConsultantEntity>
}

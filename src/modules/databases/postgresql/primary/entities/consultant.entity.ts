import {
    Field,
    ID,
    Int,
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
    HeadhuntingCompanyEntity,
} from "./headhunting-company.entity"
import {
    ConsultantTranslationEntity,
} from "./consultant-translation.entity"

@ObjectType({
    description: "IT recruitment consultant profile.",
})
@Entity("consultants")
/**
 * IT recruitment consultant profile under a headhunting company.
 */
export class ConsultantEntity extends UuidAbstractEntity {
    @Field(() => String,
        {
            description: "Full display name." 
        })
    @Column({
        name: "full_name", type: "varchar", length: 255 
    })
        fullName: string

    @Field(() => String,
        {
            description: "Stable identifier for routing." 
        })
    @Column({
        name: "display_id", type: "varchar", length: 255, unique: true 
    })
        displayId: string

    @Field(() => String,
        {
            nullable: true, description: "Job title at the company." 
        })
    @Column({
        name: "job_title", type: "varchar", length: 255, nullable: true 
    })
        jobTitle: string | null

    @Field(() => String,
        {
            nullable: true, description: "Short bio or introduction." 
        })
    @Column({
        name: "description", type: "text", nullable: true 
    })
        description: string | null

    @Field(() => String,
        {
            nullable: true, description: "LinkedIn profile URL." 
        })
    @Column({
        name: "linkedin_url", type: "varchar", length: 2048, nullable: true 
    })
        linkedinUrl: string | null

    @Field(() => String,
        {
            nullable: true, description: "Contact email." 
        })
    @Column({
        name: "email", type: "varchar", length: 255, nullable: true 
    })
        email: string | null

    @Field(() => String,
        {
            nullable: true, description: "Phone number for calls/SMS." 
        })
    @Column({
        name: "phone_number", type: "varchar", length: 32, nullable: true 
    })
        phoneNumber: string | null

    @Field(() => String,
        {
            nullable: true, description: "Zalo phone number." 
        })
    @Column({
        name: "zalo_number", type: "varchar", length: 32, nullable: true 
    })
        zaloNumber: string | null

    @Field(() => String,
        {
            nullable: true, description: "Avatar image URL." 
        })
    @Column({
        name: "avatar_url", type: "varchar", length: 2048, nullable: true 
    })
        avatarUrl: string | null

    @Field(() => Int,
        {
            description: "Display order within the company." 
        })
    @Column({
        name: "order_index", type: "int", default: 0
    })
        orderIndex: number

    @Field(() => Int,
        {
            description: "Pure ordering index used to reorder the list (decoupled from orderIndex)." 
        })
    @Column({
        name: "sort_index", type: "int", default: 0 
    })
        sortIndex: number

    @Field(() => GraphQLTypeLocale,
        {
            description: "Default locale for consultant copy." 
        })
    @Column({
        name: "default_locale", type: "enum", enum: Locale, enumName: "locale" 
    })
        defaultLocale: Locale

    @Field(() => HeadhuntingCompanyEntity,
        {
            description: "Employer company." 
        })
    @ManyToOne(
        () => HeadhuntingCompanyEntity,
        (company: HeadhuntingCompanyEntity) => company.consultants,
        {
            onDelete: "CASCADE" 
        },
    )
    @JoinColumn({
        name: "company_id",
        foreignKeyConstraintName: "fk_company_id_consultants_headhunting_companies",
    })
        company: HeadhuntingCompanyEntity

    @Field(() => ID,
        {
            description: "Employer company ID." 
        })
    @RelationId((c: ConsultantEntity) => c.company)
        companyId: string

    @Field(() => [ConsultantTranslationEntity],
        {
            description: "Localized consultant fields."
        })
    @OneToMany(
        () => ConsultantTranslationEntity,
        (translation: ConsultantTranslationEntity) => translation.consultant,
        {
            cascade: true
        },
    )
        translations: Array<ConsultantTranslationEntity>

    /**
     * Whether the requesting viewer's CV score meets {@link CV_SCORE_UNLOCK_THRESHOLD},
     * unlocking `email` / `phoneNumber` / `zaloNumber` / `linkedinUrl` below.
     * Not a database column — stamped in-request by
     * `ConsultantContactGateService` on every consultant returned from the
     * `consultant(s)` / `headhuntingCompany(ies)` queries. Anonymous viewers
     * always resolve to `false`.
     */
    @Field(() => Boolean,
        {
            description: "True when the viewer's CV score unlocks this consultant's direct contact details."
        })
        contactUnlocked: boolean

    /**
     * The CV score threshold contact unlock is gated on, echoed back so the
     * client can render "Cần điểm CV ≥ X" without hardcoding the number.
     * Not a database column — stamped alongside `contactUnlocked`.
     */
    @Field(() => Int,
        {
            description: "CV score (0-100) required to unlock this consultant's contact details."
        })
        cvScoreUnlockThreshold: number
}

import {
    Field,
    Float,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    OneToMany,
} from "typeorm"
import {
    PrerequisiteEntity,
} from "./prerequisite.entity"
import {
    QnaEntity,
} from "./qna.entity"
import {
    ModuleEntity,
} from "./module.entity"
import {
    EnrollmentEntity,
} from "./enrollment.entity"
import {
    ValuePropositionEntity,
} from "./value-proposition.entity"
import {
    GraphQLTypeLocale,
    GraphQLTypePricingPhase,
    Locale,
    PricingPhase,
} from "../enums"
import {
    PricingPhaseEntity,
} from "./pricing-phase.entity"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    CourseTranslationEntity,
} from "./course-translation.entity"

/**
 * Course entity representing a sellable learning program
 * with ordered modules, pricing phases, and localized content.
 */
@ObjectType({
    description: "Course entity representing a sellable learning program with ordered modules, pricing phases, and localized content.",
})
@Entity("courses")
export class CourseEntity extends UuidAbstractEntity {
    /**
     * Human-readable course title.
     */
    @Field(
        () => String,
        {
            description: "Human-readable course title.",
        },
    )
    @Column({
        name: "title",
        type: "varchar",
        length: 255,
    })
        title: string

    /**
     * Human-facing stable identifier for display and external references (not the primary key).
     */
    @Field(
        () => String,
        {
            description: "Human-facing stable identifier for display and external references (not the primary key).",
        },
    )
    @Column({
        name: "display_id",
        type: "varchar",
        length: 255,
        unique: true,
    })
        displayId: string

    /**
     * SEO-friendly slug used for public routing.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "SEO-friendly slug used for public routing.",
        },
    )
    @Column({
        name: "slug",
        type: "varchar",
        length: 255,
        unique: true,
        nullable: true,
    })
        slug?: string

    /**
     * Short public description of the course.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Short public description of the course.",
        },
    )
    @Column({
        name: "description",
        type: "text",
    })
        description: string

    /**
     * Public CDN URL of the serialized course payload (if synced).
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Public CDN URL of the serialized course payload (if synced).",
        },
    )
    @Column({
        name: "cdn_url",
        type: "varchar",
        length: 2048,
        nullable: true,
    })
        cdnUrl?: string | null

    /**
     * Original list price of the course before pricing phase discounts.
     */
    @Field(
        () => Float,
        {
            description: "Original list price of the course before pricing phase discounts.",
        },
    )
    @Column({
        name: "original_price",
        type: "double precision",
    })
        originalPrice: number

    /**
     * Current pricing phase applied to the course.
     *
     * Stored as enum string instead of foreign key
     * to avoid circular dependency with pricing phase rows.
     */
    @Field(
        () => GraphQLTypePricingPhase,
        {
            description: "Current pricing phase applied to the course.",
        },
    )
    @Column({
        name: "current_phase",
        type: "enum",
        enum: PricingPhase,
        enumName: "pricing_phase",
    })
        currentPhase: PricingPhase

    /**
     * Ordered pricing phase rows of the course.
     *
     * Expected tiers:
     * - Pioneer
     * - EarlyBird
     * - Regular
     */
    @Field(
        () => [PricingPhaseEntity],
        {
            name: "pricingPhases",
            description: "Exactly three tiers per course: Pioneer, EarlyBird, Regular (name/description on FE).",
        },
    )
    @OneToMany(
        () => PricingPhaseEntity,
        (pricingPhase: PricingPhaseEntity) => pricingPhase.course,
        {
            cascade: true,
        },
    )
        pricingPhases: Array<PricingPhaseEntity>

    /**
     * Ordered prerequisites required before joining the course.
     */
    @Field(
        () => [PrerequisiteEntity],
        {
            description: "Ordered prerequisites required before joining the course.",
        },
    )
    @OneToMany(
        () => PrerequisiteEntity,
        (prerequisite: PrerequisiteEntity) => prerequisite.course,
        {
            cascade: true,
        },
    )
        prerequisites: Array<PrerequisiteEntity>

    /**
     * Ordered value proposition lines shown in landing or sales pages.
     */
    @Field(
        () => [ValuePropositionEntity],
        {
            name: "valuePropositions",
            description: "Value proposition lines, ordered by orderIndex.",
        },
    )
    @OneToMany(
        () => ValuePropositionEntity,
        (valueProposition: ValuePropositionEntity) => valueProposition.course,
        {
            cascade: true,
        },
    )
        valuePropositions: Array<ValuePropositionEntity>

    /**
     * Ordered frequently asked questions of the course.
     */
    @Field(
        () => [QnaEntity],
        {
            description: "Ordered frequently asked questions for the course.",
        },
    )
    @OneToMany(
        () => QnaEntity,
        (qna: QnaEntity) => qna.course,
        {
            cascade: true,
        },
    )
        qnas: Array<QnaEntity>

    /**
     * Ordered learning modules belonging to the course.
     */
    @Field(
        () => [ModuleEntity],
        {
            description: "Ordered learning modules belonging to the course.",
        },
    )
    @OneToMany(
        () => ModuleEntity,
        (module: ModuleEntity) => module.course,
        {
            cascade: true,
        },
    )
        modules: Array<ModuleEntity>

    /**
     * Enrollments associated with the course.
     */
    @Field(
        () => [EnrollmentEntity],
        {
            nullable: true,
            description: "User enrollments for this course.",
        },
    )
    @OneToMany(
        () => EnrollmentEntity,
        (enrollment: EnrollmentEntity) => enrollment.course,
        {
            cascade: true,
        },
    )
        enrollments: Array<EnrollmentEntity>

    /**
     * Localized translations of course fields such as title and description.
     */
    @Field(
        () => [CourseTranslationEntity],
        {
            description: "Localized overrides for course fields (e.g. title, description).",
        },
    )
    @OneToMany(
        () => CourseTranslationEntity,
        (courseTranslation: CourseTranslationEntity) => courseTranslation.course,
        {
            cascade: true,
        },
    )
        translations: Array<CourseTranslationEntity>

    /**
     * Default locale for the course.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for course copy when no translation applies.",
        },
    )
    @Column({
        name: "default_locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        defaultLocale: Locale
}
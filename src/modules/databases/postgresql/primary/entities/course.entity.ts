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
    StringAbstractEntity,
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
export class CourseEntity extends StringAbstractEntity {
    /**
     * Human-readable course title.
     */
    @Field(() => String)
    @Column({
        name: "title",
        type: "varchar",
        length: 255,
    })
        title: string

    /**
     * SEO-friendly slug used for public routing.
     */
    @Field(
        () => String,
        {
            nullable: true,
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
        },
    )
    @Column({
        name: "description",
        type: "text",
    })
        description: string
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
    @Field(() => [PrerequisiteEntity])
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
    @Field(() => [QnaEntity])
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
    @Field(() => [ModuleEntity])
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
            nullable: true,
        },
    )
    @OneToMany(
        () => CourseTranslationEntity,
        (courseTranslation: CourseTranslationEntity) => courseTranslation.course,
        {
            cascade: true,
        },
    )
        translations?: Array<CourseTranslationEntity>

    /**
     * Default locale for the course.
     */
    @Field(() => GraphQLTypeLocale)
    @Column({
        name: "default_locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        defaultLocale: Locale
}
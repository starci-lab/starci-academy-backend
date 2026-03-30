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
    PrerequisiteEntity 
} from "./prerequisite.entity"
import {
    QnaEntity 
} from "./qna.entity"
import {
    ModuleEntity 
} from "./module.entity"
import {
    EnrollmentEntity,
} from "./enrollment.entity"
import {
    ValuePropositionEntity,
} from "./value-proposition.entity"
import {
    GraphQLTypePricingPhase,
    PricingPhase,
} from "../enums"
import {
    PricingPhaseEntity,
} from "./pricing-phase.entity"
import {
    StringAbstractEntity,
} from "./abstract"

@ObjectType({
    description: "A course containing ordered modules."
})
@Entity("courses")
export class CourseEntity extends StringAbstractEntity {
    @Field(() => String)
    @Column({
        name: "title",
        type: "varchar",
        length: 255
    })
        title: string

    @Field(() => String,
        {
            nullable: true
        })
    @Column({
        name: "slug",
        type: "varchar",
        length: 255,
        unique: true,
        nullable: true
    })
        slug: string | null

    @Field(() => String,
        {
            nullable: true
        })
    @Column({
        name: "description",
        type: "text",
        nullable: true
    })
        description: string | null

    @Field(() => String,
        {
            nullable: true,
            description: "Public CDN URL pointing to the course JSON on S3."
        })
    @Column({
        name: "cdn_url",
        type: "varchar",
        length: 2048,
        nullable: true
    })
        cdnUrl: string | null

    @Field(
        () => Float,
        {
            nullable: true,
            description: "List / Regular price; tier Regular row has null `regular` — use this.",
        },
    )
    @Column({
        name: "original_price",
        type: "double precision",
        nullable: true,
    })
        originalPrice: number | null

    /**
     * Bậc giá đang áp dụng (enum; không FK — tránh vòng phụ thuộc với `pricing_phases` khi sync DB).
     */
    @Field(
        () => GraphQLTypePricingPhase,
        {
            nullable: true,
        },
    )
    @Column({
        name: "current_phase",
        type: "varchar",
        length: 32,
        nullable: true,
    })
        currentPhase: PricingPhase | null

    @Field(
        () => [PricingPhaseEntity],
        {
            name: "pricingPhases",
            description: "Exactly three tiers per course: Pioneer, EarlyBird, Regular (name/description on FE).",
        },
    )
    @OneToMany(
        () => PricingPhaseEntity,
        (row: PricingPhaseEntity) => row.course,
        {
            cascade: true,
        },
    )
        pricingPhases: Array<PricingPhaseEntity>

    @Field(() => [PrerequisiteEntity])
    @OneToMany(() => PrerequisiteEntity,
        (row: PrerequisiteEntity) => row.course,
        {
            cascade: true
        })
        prerequisites: Array<PrerequisiteEntity>

    @Field(() => [ValuePropositionEntity],
        {
            name: "valuePropositions",
            description: "Value proposition lines, ordered by orderIndex.",
        },
    )
    @OneToMany(
        () => ValuePropositionEntity,
        (row: ValuePropositionEntity) => row.course,
        {
            cascade: true,
        },
    )
        valuePropositions: Array<ValuePropositionEntity>

    @Field(() => [QnaEntity])
    @OneToMany(() => QnaEntity,
        (row: QnaEntity) => row.course,
        {
            cascade: true
        })
        qnas: Array<QnaEntity>

    @Field(() => [ModuleEntity])
    @OneToMany(() => ModuleEntity,
        (mod: ModuleEntity) => mod.course,
        {
            cascade: true
        })
        modules: Array<ModuleEntity>

    @Field(() => [EnrollmentEntity],
        {
            nullable: true,
        })
    @OneToMany(() => EnrollmentEntity,
        (enrollment: EnrollmentEntity) => enrollment.course,
        {
            cascade: true,
        })
        enrollments: Array<EnrollmentEntity>
}

import {
    Field,
    Float,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    RelationId,
} from "typeorm"
import {
    GraphQLTypePricingPhase,
    PricingPhase,
} from "../enums"
import {
    CourseEntity,
} from "./course.entity"
import {
    UuidAbstractEntity,
} from "./abstract"

/**
 * Each course has exactly three pricing tiers: Pioneer, EarlyBird, Regular. 
 */
@ObjectType({
    description: "Each course has exactly three pricing tiers: Pioneer, EarlyBird, Regular.",
})
@Entity("pricing_phases")
export class PricingPhaseEntity extends UuidAbstractEntity {
    /**
     * Course this pricing phase belongs to.
     */
    @ManyToOne(
        () => CourseEntity,
        (course: CourseEntity) => course.pricingPhases,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "course_id",
        foreignKeyConstraintName:
            "fk_course_id_pricing_phases_courses",
    })
        course: CourseEntity

    @Field(
        () => ID,
        {
            description: "Parent course ID.",
        },
    )
    @RelationId(
        (phase: PricingPhaseEntity) => phase.course,
    )
        courseId: string

    /**
     * Tier key (pioneer, earlybird, regular).
     */
    @Field(
        () => GraphQLTypePricingPhase,
        {
            description: "Tier key (pioneer, earlybird, regular).",
        },
    )
    @Column({
        name: "phase",
        type: "varchar",
        length: 32,
    })
        phase: PricingPhase 

    /**
     * Tier price for this phase; null for Regular tier (use course originalPrice).
     */
    @Field(
        () => Float,
        {
            name: "price",
            nullable: true,
            description: "Tier price for this phase; null for Regular tier (use course originalPrice).",
        },
    )
    @Column({
        name: "price",
        type: "double precision",
        nullable: true,
    })
        price: number | null

    /**
     * null = không giới hạn chỗ (FE có thể hiển thị “không giới hạn”).
     */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "Remaining seats for this tier; null means unlimited.",
        },
    )
    @Column({
        name: "slot_available",
        type: "int",
        nullable: true,
    })
        slotAvailable: number | null

    /**
     * Display order among pricing tiers for the course.
     */
    @Field(
        () => Int,
        {
            description: "Display order among pricing tiers for the course.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number
}

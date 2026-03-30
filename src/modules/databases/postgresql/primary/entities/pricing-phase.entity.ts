import {
    Field,
    Float,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    Unique,
} from "typeorm"
import {
    GraphQLTypePricingPhase,
    PricingPhase,
} from "../enums"
import {
    CourseEntity,
} from "./course.entity"
import {
    StringAbstractEntity,
} from "./abstract"

/**
 * Each course has exactly three pricing tiers: Pioneer, EarlyBird, Regular. 
 */
@ObjectType({
    description: "Per-course tier row; `regular` is tier price (null for Regular — use course.originalPrice).",
})
@Entity("pricing_phases")
@Unique(
    "UQ_pricing_phases_course_phase",
    [
        "course",
        "phase",
    ],
)
export class PricingPhaseEntity extends StringAbstractEntity {
    @ManyToOne(
        () => CourseEntity,
        (course: CourseEntity) => course.pricingPhases,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "course_id",
    })
        course: CourseEntity

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

    @Field(
        () => Float,
        {
            name: "price",
            nullable: true,
        },
    )
    @Column({
        name: "price",
        type: "double precision",
        nullable: true,
    })
        price?: number

    /**
     * null = không giới hạn chỗ (FE có thể hiển thị “không giới hạn”).
     */
    @Field(
        () => Int,
        {
            nullable: true,
        },
    )
    @Column({
        name: "slot_available",
        type: "int",
        nullable: true,
    })
        slotAvailable: number | null

    @Field(
        () => Int,
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number
}

import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
} from "typeorm"
import {
    CourseEntity,
} from "./course.entity"
import {
    PricingPhase,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"

/**
 * One-to-one operational metadata for a course (e.g. active pricing tier).
 */
@Entity("course_metadata")
export class CourseMetadataEntity extends UuidAbstractEntity {
    @OneToOne(
        () => CourseEntity,
        (course: CourseEntity) => course.metadata,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "course_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_course_id_course_metadata_courses",
    })
        course: CourseEntity

    @Column({
        name: "current_phase",
        type: "enum",
        enum: PricingPhase,
        enumName: "pricing_phase",
    })
        currentPhase: PricingPhase
}

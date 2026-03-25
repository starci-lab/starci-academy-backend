import {
    Field, ObjectType 
} from "@nestjs/graphql"
import {
    Entity, JoinColumn, OneToMany, OneToOne 
} from "typeorm"
import {
    AdvancedContentEntity 
} from "./advanced-content.entity"
import {
    CourseEntity 
} from "./course.entity"
import {
    GeneralContentEntity 
} from "./general-content.entity"
import {
    StringAbstractEntity 
} from "./abstract"

/**
 * Subscription / premium bundle for a course: holds general and advanced material.
 */
@ObjectType({
    description: "Premium content grouping general and advanced items for a course."
})
@Entity("premium_contents")
export class PremiumContentEntity extends StringAbstractEntity {
    @Field(() => CourseEntity)
    @OneToOne(() => CourseEntity,
        (course: CourseEntity) => course.premiumContent,
        {
            onDelete: "CASCADE"
        })
    @JoinColumn({
        name: "course_id"
    })
        course: CourseEntity

    @Field(() => [GeneralContentEntity])
    @OneToMany(() => GeneralContentEntity,
        (row: GeneralContentEntity) => row.premiumContent,
        {
            cascade: true
        })
        generalContent: GeneralContentEntity

    @Field(() => [AdvancedContentEntity])
    @OneToMany(() => AdvancedContentEntity,
        (row: AdvancedContentEntity) => row.premiumContent,
        {
            cascade: true
        })
        advancedContent: AdvancedContentEntity
}

import {
    Field, Int, ObjectType 
} from "@nestjs/graphql"
import {
    Column, Entity, JoinColumn, ManyToOne 
} from "typeorm"
import {
    AdvancedContentEntity 
} from "./advanced-content.entity"
import {
    StringAbstractEntity 
} from "./abstract"

/**
 * Ordered section (heading + markdown block) inside an advanced content item.
 */
@ObjectType({
    description: "Section belonging to premium advanced content."
})
@Entity("premium_advanced_content_sections")
export class AdvancedContentSectionEntity extends StringAbstractEntity {
    @Field(() => String,
        {
            nullable: true
        })
    @Column({
        name: "title",
        type: "varchar",
        length: 500,
        nullable: true
    })
        title: string | null

    @Field(() => String,
        {
            description: "Markdown body for this section."
        })
    @Column({
        name: "body",
        type: "text"
    })
        body: string

    @Field(() => Int)
    @Column({
        name: "order_index",
        type: "int",
        default: 0
    })
        orderIndex: number

    @Field(() => AdvancedContentEntity)
    @ManyToOne(() => AdvancedContentEntity,
        (adv: AdvancedContentEntity) => adv.sections,
        {
            onDelete: "CASCADE"
        })
    @JoinColumn({
        name: "premium_advanced_content_id"
    })
        advancedContent: AdvancedContentEntity
}

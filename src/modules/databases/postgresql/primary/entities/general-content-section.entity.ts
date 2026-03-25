import {
    Field, Int, ObjectType 
} from "@nestjs/graphql"
import {
    Column, Entity, JoinColumn, ManyToOne 
} from "typeorm"
import {
    GeneralContentEntity 
} from "./general-content.entity"
import {
    StringAbstractEntity 
} from "./abstract"

/**
 * Ordered section (heading + markdown block) inside a general content item.
 */
@ObjectType({
    description: "Section belonging to general course content."
})
@Entity("general_content_sections")
export class GeneralContentSectionEntity extends StringAbstractEntity {
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

    @Field(() => GeneralContentEntity)
    @ManyToOne(() => GeneralContentEntity,
        (gen: GeneralContentEntity) => gen.sections,
        {
            onDelete: "CASCADE"
        })
    @JoinColumn({
        name: "general_content_id"
    })
        generalContent: GeneralContentEntity
}

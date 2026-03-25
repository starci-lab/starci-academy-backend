import {
    Field, ObjectType 
} from "@nestjs/graphql"
import {
    Column, Entity 
} from "typeorm"
import {
    StringAbstractEntity 
} from "./abstract"

/**
 * Single markdown document for a course (e.g. scripts / subscriber notes).
 */
@ObjectType({
    description: "Markdown content"
})
@Entity("markdowns")
export class MarkdownEntity extends StringAbstractEntity {
    @Field(() => String,
        {
            nullable: true
        })
    @Column({
        name: "title",
        type: "varchar",
        length: 500
    })
        title: string

    @Field(() => String,
        {
            description: "Markdown body (e.g. scripts)."
        })
    @Column({
        name: "body",
        type: "text"
    })
        body: string
}

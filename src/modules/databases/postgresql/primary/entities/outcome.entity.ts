import {
    Field, Int, ObjectType 
} from "@nestjs/graphql"
import {
    Column, Entity, JoinColumn, ManyToOne 
} from "typeorm"
import {
    ModuleEntity 
} from "./module.entity"
import {
    StringAbstractEntity 
} from "./abstract"

@ObjectType({
    description: "A learning outcome for a course module."
})
@Entity("outcomes")
export class OutcomeEntity extends StringAbstractEntity {
    @Field(() => String)
    @Column({
        name: "title",
        type: "varchar",
        length: 500
    })
        title: string

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

    @Field(() => Int)
    @Column({
        name: "order_index",
        type: "int",
        default: 0
    })
        orderIndex: number

    @Field(() => ModuleEntity)
    @ManyToOne(() => ModuleEntity,
        (mod: ModuleEntity) => mod.outcomes,
        {
            onDelete: "CASCADE"
        })
    @JoinColumn({
        name: "course_module_id"
    })
        module: ModuleEntity
}

import {
    Field, Int, ObjectType 
} from "@nestjs/graphql"
import {
    Column, Entity, JoinColumn, OneToMany, OneToOne 
} from "typeorm"
import {
    GeneralContentSectionEntity 
} from "./general-content-section.entity"
import {
    ModuleEntity 
} from "./module.entity"
import {
    StringAbstractEntity 
} from "./abstract"

/**
 * General module material (e.g. article split into sections).
 */
@ObjectType({
    description: "General content attached to a module."
})
@Entity("general_contents")
export class GeneralContentEntity extends StringAbstractEntity {
    @Field(() => String)
    @Column({
        name: "title",
        type: "varchar",
        length: 500
    })
        title: string

    @Field(() => String,
        {
            nullable: true,
            description: "Optional markdown body when not using sections only."
        })
    @Column({
        name: "body",
        type: "text",
        nullable: true
    })
        body: string | null

    @Field(() => Int)
    @Column({
        name: "order_index",
        type: "int",
        default: 0
    })
        orderIndex: number

    @Field(() => ModuleEntity)
    @OneToOne(() => ModuleEntity,
        (mod: ModuleEntity) => mod.generalContent,
        {
            onDelete: "CASCADE"
        })
    @JoinColumn({
        name: "module_id"
    })
        module: ModuleEntity

    @Field(() => [GeneralContentSectionEntity])
    @OneToMany(() => GeneralContentSectionEntity,
        (row: GeneralContentSectionEntity) => row.generalContent,
        {
            cascade: true
        })
        sections: Array<GeneralContentSectionEntity>
}

import {
    Field, Int, ObjectType 
} from "@nestjs/graphql"
import {
    Column, Entity, JoinColumn, OneToMany, OneToOne 
} from "typeorm"
import {
    AdvancedContentSectionEntity 
} from "./advanced-content-section.entity"
import {
    ModuleEntity 
} from "./module.entity"
import {
    StringAbstractEntity 
} from "./abstract"

/**
 * Extra “advanced” material for a course module (e.g. article split into sections).
 */
@ObjectType({
    description: "Advanced content attached to a module."
})
@Entity("premium_advanced_contents")
export class AdvancedContentEntity extends StringAbstractEntity {
    @Field(() => String)
    @Column({
        name: "title",
        type: "varchar",
        length: 500
    })
        title: string

    @Field(() => Int)
    @Column({
        name: "order_index",
        type: "int",
        default: 0
    })
        orderIndex: number

    @Field(() => ModuleEntity)
    @OneToOne(() => ModuleEntity,
        (mod: ModuleEntity) => mod.advancedContent,
        {
            onDelete: "CASCADE"
        })
    @JoinColumn({
        name: "module_id"
    })
        module: ModuleEntity

    @Field(() => [AdvancedContentSectionEntity])
    @OneToMany(() => AdvancedContentSectionEntity,
        (row: AdvancedContentSectionEntity) => row.advancedContent,
        {
            cascade: true
        })
        sections: Array<AdvancedContentSectionEntity>
}

import {
    Field, ObjectType 
} from "@nestjs/graphql"
import {
    Column, Entity, OneToMany 
} from "typeorm"
import {
    PrerequisiteEntity 
} from "./prerequisite.entity"
import {
    QnaEntity 
} from "./qna.entity"
import {
    ModuleEntity 
} from "./module.entity"
import {
    StringAbstractEntity 
} from "./abstract"

@ObjectType({
    description: "A course containing ordered modules."
})
@Entity("courses")
export class CourseEntity extends StringAbstractEntity {
    @Field(() => String)
    @Column({
        name: "title",
        type: "varchar",
        length: 255
    })
        title: string

    @Field(() => String,
        {
            nullable: true
        })
    @Column({
        name: "slug",
        type: "varchar",
        length: 255,
        unique: true,
        nullable: true
    })
        slug: string | null

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

    @Field(() => String,
        {
            nullable: true,
            description: "Public CDN URL pointing to the course JSON on S3."
        })
    @Column({
        name: "cdn_url",
        type: "varchar",
        length: 2048,
        nullable: true
    })
        cdnUrl: string | null

    @Field(() => [PrerequisiteEntity])
    @OneToMany(() => PrerequisiteEntity,
        (row: PrerequisiteEntity) => row.course,
        {
            cascade: true
        })
        prerequisites: Array<PrerequisiteEntity>

    @Field(() => [QnaEntity])
    @OneToMany(() => QnaEntity,
        (row: QnaEntity) => row.course,
        {
            cascade: true
        })
        qnas: Array<QnaEntity>

    @Field(() => [ModuleEntity])
    @OneToMany(() => ModuleEntity,
        (mod: ModuleEntity) => mod.course,
        {
            cascade: true
        })
        modules: Array<ModuleEntity>
}

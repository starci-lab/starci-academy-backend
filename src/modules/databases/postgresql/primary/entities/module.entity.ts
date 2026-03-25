import {
    Field, Int, ObjectType 
} from "@nestjs/graphql"
import {
    Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne 
} from "typeorm"
import {
    AdvancedContentEntity 
} from "./advanced-content.entity"
import {
    CourseEntity 
} from "./course.entity"
import {
    ContentEntity 
} from "./content.entity"
import {
    GeneralContentEntity 
} from "./general-content.entity"
import {
    ExclusiveLessonVideoEntity 
} from "./exclusive-lesson-video.entity"
import {
    OutcomeEntity 
} from "./outcome.entity"
import {
    SubmissionEntity 
} from "./submission.entity"
import {
    StringAbstractEntity 
} from "./abstract"

@ObjectType({
    description: "A module belonging to a course; contains learning outcomes."
})
@Entity("modules")
export class ModuleEntity extends StringAbstractEntity {
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

    @Field(() => CourseEntity)
    @ManyToOne(() => CourseEntity,
        (course: CourseEntity) => course.modules,
        {
            onDelete: "CASCADE"
        })
    @JoinColumn({
        name: "course_id"
    })
        course: CourseEntity

    @Field(() => GeneralContentEntity,
        {
            nullable: true
        })
    @OneToOne(() => GeneralContentEntity,
        (row: GeneralContentEntity) => row.module,
        {
            cascade: true
        })
        generalContent: GeneralContentEntity

    @Field(() => AdvancedContentEntity,
        {
            nullable: true
        })
    @OneToOne(() => AdvancedContentEntity,
        (row: AdvancedContentEntity) => row.module,
        {
            cascade: true
        })
        advancedContent: AdvancedContentEntity

    @Field(() => [ContentEntity])
    @OneToMany(() => ContentEntity,
        (row: ContentEntity) => row.module,
        {
            cascade: true
        })
        contents: Array<ContentEntity>

    @Field(() => [ExclusiveLessonVideoEntity])
    @OneToMany(() => ExclusiveLessonVideoEntity,
        (row: ExclusiveLessonVideoEntity) => row.module,
        {
            cascade: true
        })
        exclusiveLessonVideos: Array<ExclusiveLessonVideoEntity>

    @Field(() => [OutcomeEntity])
    @OneToMany(() => OutcomeEntity,
        (outcome: OutcomeEntity) => outcome.module,
        {
            cascade: true
        })
        outcomes: Array<OutcomeEntity>

    @Field(() => [SubmissionEntity],
        {
            nullable: true
        })
    @OneToMany(() => SubmissionEntity,
        (sub: SubmissionEntity) => sub.module,
        {
            cascade: true
        })
        submissions: Array<SubmissionEntity>
}

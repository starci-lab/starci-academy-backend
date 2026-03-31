import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
} from "typeorm"
import {
    ModuleEntity,
} from "./module.entity"
import {
    StringAbstractEntity,
} from "./abstract"

/**
 * Lesson video for a module (e.g. YouTube URL with metadata).
 */
@ObjectType({
    description: "Lesson video link (typically YouTube) attached to a module.",
})
@Entity("lesson_videos")
export class LessonVideoEntity extends StringAbstractEntity {
    @Field(() => String)
    @Column({
        name: "title",
        type: "varchar",
        length: 500,
    })
        title: string

    @Field(
        () => String,
        {
            nullable: true,
        },
    )
    @Column({
        name: "description",
        type: "text",
        nullable: true,
    })
        description: string | null

    @Field(
        () => String,
        {
            description: "Video URL (e.g. YouTube watch or embed link).",
        },
    )
    @Column({
        name: "url",
        type: "varchar",
        length: 2048,
    })
        url: string

    @Field(
        () => Int,
        {
            description: "Video duration in milliseconds (for sorting, progress, APIs).",
        },
    )
    @Column({
        name: "duration_ms",
        type: "int",
    })
        durationMs: number

    @Field(() => Int)
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    @Field(() => ModuleEntity)
    @ManyToOne(
        () => ModuleEntity,
        (module: ModuleEntity) => module.lessonVideos,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "module_id",
    })
        module: ModuleEntity
}


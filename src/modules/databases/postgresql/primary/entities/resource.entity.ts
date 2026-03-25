import {
    Field, ObjectType 
} from "@nestjs/graphql"
import {
    Column, Entity, JoinColumn, ManyToOne 
} from "typeorm"
import {
    ResourceType 
} from "../enums/resource-type"
import {
    SubmissionEntity 
} from "./submission.entity"
import {
    UuidAbstractEntity 
} from "./abstract"

/**
 * A single submission resource: either a list of folder paths or a Git URL.
 */
@ObjectType({
    description: "Resource item (driver URL or Git URL)."
})
@Entity("resources")
export class ResourceEntity extends UuidAbstractEntity {
    @Field(() => ResourceType,
        {
            description: "Resource payload kind: folders path list or a Git URL."
        })
    @Column({
        name: "type",
        type: "enum",
        enum: ResourceType,
        enumName: "resource_type_enum"
    })
        type: ResourceType

    @Field(() => [String],
        {
            nullable: true,
            description: "Folder paths when type is folders."
        })
    @Column({
        name: "folders_json",
        type: "jsonb",
        nullable: true
    })
        foldersJson: Array<string> | null

    @Field(() => String,
        {
            nullable: true,
            description: "Git remote URL when type is giturl."
        })
    @Column({
        name: "git_url",
        type: "varchar",
        length: 2048,
        nullable: true
    })
        gitUrl: string | null

    @Field(() => SubmissionEntity,
        {
            description: "Parent submission that owns this resource."
        })
    @ManyToOne(() => SubmissionEntity,
        (sub: SubmissionEntity) => sub.resources,
        {
            onDelete: "CASCADE"
        })
    @JoinColumn({
        name: "submission_id"
    })
        submission: SubmissionEntity
}


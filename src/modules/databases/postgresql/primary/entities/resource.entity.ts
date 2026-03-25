import {
    Field, ObjectType 
} from "@nestjs/graphql"
import {
    Check, Column, Entity, JoinColumn, ManyToOne 
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
    description: "Submission resource item (folders or git URL)."
})
@Check(`(
    ("type" = 'folders' AND git_url IS NULL AND folders_json IS NOT NULL AND jsonb_array_length(folders_json) > 0)
    OR
    ("type" = 'giturl' AND folders_json IS NULL AND git_url IS NOT NULL)
)`)
@Entity("submission_resources")
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


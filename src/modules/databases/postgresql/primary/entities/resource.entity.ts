import {
    Field, ObjectType 
} from "@nestjs/graphql"
import {
    Column, Entity, JoinColumn, ManyToOne 
} from "typeorm"
import {
    GraphQLTypeResourceType,
    ResourceType,
} from "../enums/resource-type"
import {
    ChallengeSubmissionEntity 
} from "./challenge-submission.entity"
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
    @Field(() => GraphQLTypeResourceType,
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

    @Field(() => ChallengeSubmissionEntity,
        {
            description: "Parent submission requirement that owns this resource."
        })
    @ManyToOne(() => ChallengeSubmissionEntity,
        (submission: ChallengeSubmissionEntity) => submission.resources,
        {
            onDelete: "CASCADE"
        })
    @JoinColumn({
        name: "challenge_submission_id",
        foreignKeyConstraintName: "fk_challenge_submission_id_resources",
    })
        challengeSubmission: ChallengeSubmissionEntity
}


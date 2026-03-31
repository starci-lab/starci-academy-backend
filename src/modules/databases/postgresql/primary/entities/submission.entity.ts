import {
    Field, ObjectType 
} from "@nestjs/graphql"
import {
    Entity, JoinColumn, ManyToOne, OneToMany, Unique 
} from "typeorm"
import {
    ModuleEntity 
} from "./module.entity"
import {
    UserEntity 
} from "./user.entity"
import {
    ResourceEntity 
} from "./resource.entity"
import {
    UuidAbstractEntity 
} from "./abstract"

/**
 * A learner submission: either a list of folder paths or a Git repository URL.
 */
@ObjectType({
    description: "Submission container that owns multiple resources."
})
@Entity("submissions")
@Unique("UQ_submissions_user_module",
    [
        "user",
        "module",
    ])
export class SubmissionEntity extends UuidAbstractEntity {
    /**
     * User who submitted the work.
     */
    @Field(() => UserEntity,
        {
            description: "User who submitted the work."
        })
    @ManyToOne(() => UserEntity,
        (user: UserEntity) => user.submissions,
        {
            onDelete: "CASCADE"
        })
    @JoinColumn({
        name: "user_id"
    })
        user: UserEntity

    /**
     * Module/course unit the submission belongs to.
     */
    @Field(() => ModuleEntity,
        {
            description: "Module/course unit the submission belongs to."
        })
    @ManyToOne(() => ModuleEntity,
        (module: ModuleEntity) => module.submissions,
        {
            onDelete: "CASCADE"
        })
    @JoinColumn({
        name: "module_id"
    })
        module: ModuleEntity

    /**
     * Submitted resources (folder list or Git URL).
     */
    @Field(() => [ResourceEntity],
        {
            nullable: true,
            description: "Submitted resources (folder list or Git URL)."
        })
    @OneToMany(() => ResourceEntity,
        (resource: ResourceEntity) => resource.submission,
        {
            cascade: true
        })
        resources: Array<ResourceEntity>
}

import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

/** Request for the module GraphQL query (by id or displayId). */
@InputType({
    description: "Request for fetching a module by primary id or display id.",
})
export class ModuleRequest {
    @Field(
        () => ID,
        {
            description: "Module id to fetch.",
            nullable: true,
        },
    )
        id?: string

    @Field(
        () => ID,
        {
            description: "Module display id to fetch.",
            nullable: true,
        },
    )
        displayId?: string
}

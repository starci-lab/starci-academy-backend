import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request for fetching a module by primary id or display id.",
})
/** Request for the module GraphQL query (by id or displayId). */
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

import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

/** Request for fetching a module by id. */
@InputType({
    description: "Request for fetching a module by id.",
})
export class ModuleRequest {
    @Field(
        () => ID,
        {
            description: "Module id to fetch.",
        },
    )
        id: string
}


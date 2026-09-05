import {
    Field,
    InputType,
} from "@nestjs/graphql"
import {
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
} from "class-validator"

@InputType({
    description: "Optional filters for the independent concept catalog.",
})
/** Optional category and difficulty filters for the concept listing. */
export class ConceptsRequest {
    @Field(() => String,
        {
            nullable: true,
            description: "Return only concepts in this category.",
        })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(128)
        category?: string

    @Field(() => String,
        {
            nullable: true,
            description: "Return only concepts at this difficulty.",
        })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(32)
        difficulty?: string
}

@InputType({
    description: "Stable route identity for one concept.",
})
/** Identifies a concept independently of courses. */
export class ConceptRequest {
    @Field(() => String,
        {
            description: "Concept slug used by the `/concept/[displayId]` route.",
        })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u)
        displayId: string
}

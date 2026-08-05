import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    IsBoolean,
    IsString,
} from "class-validator"

@ObjectType({
    isAbstract: true,
    description: "Base response for all GraphQL queries and mutations.",
})
/**
 * Envelope every GraphQL op returns so the interceptor can stamp
 * success/message/error uniformly. `data` lives on subclasses and stays null
 * on failure -- do not put payload fields here or errors leak typed data.
 */
export abstract class AbstractGraphQLResponse {
    @IsBoolean()
    @Field(() => Boolean,
        {
            description: "The success of the response.",
        })
        success: boolean

    @IsString()
    @Field(() => String,
        {
            description: "The message of the response.",
        })
        message: string

    @IsString()
    @Field(() => String,
        {
            nullable: true,
            description: "The error of the response.",
        })
        error?: string
}

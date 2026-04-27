import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** Result of checking an email against the bloom filter. */
@ObjectType({
    description: "Email existence check result (bloom-filter based).",
})
export class CheckEmailExistsData {
    @Field(
        () => Boolean,
        {
            description: "True when bloom filter indicates the email may exist; false means it definitely does not exist in the filter.",
        },
    )
        exists: boolean

    @Field(
        () => Boolean,
        {
            description: "True when the bloom filter is available in cache; false when it has not been built yet.",
        },
    )
        isBloomFilterReady: boolean
}

@ObjectType({
    description: "Response wrapper for the check email exists query.",
})
export class CheckEmailExistsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CheckEmailExistsData>
{
    @Field(
        () => CheckEmailExistsData,
        {
            nullable: true,
        },
    )
        data?: CheckEmailExistsData
}


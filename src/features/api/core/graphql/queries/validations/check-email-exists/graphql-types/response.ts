import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Email existence check result (bloom-filter based).",
})
/** Result of checking an email against the bloom filter. */
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
/**
 * GraphQL envelope for `checkEmailExists`. The payload is bloom-filter
 * based: `exists: true` is a maybe (false positives), `exists: false` is
 * definite absence -- signup UI must not treat a hit as proof the email is
 * taken without a later authoritative check.
 */
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
        data: CheckEmailExistsData
}


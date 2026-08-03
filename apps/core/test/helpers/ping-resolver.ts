import {
    Query,
    Resolver,
} from "@nestjs/graphql"

/**
 * A no-op root `@Query` resolver for e2e specs that only exercise mutations.
 *
 * The GraphQL spec requires every schema to define a root `Query` type; a
 * testing module that registers only mutation resolvers therefore fails schema
 * validation at `app.init()` with "Query root type must be provided." Adding
 * this resolver to such a module's `providers` satisfies that requirement
 * without pulling in any real query flow.
 */
@Resolver()
export class PingResolver {
    /**
     * Trivial root query so the generated schema has a valid `Query` type.
     *
     * @returns Always `true`.
     */
    @Query(() => Boolean,
        {
            name: "e2ePing",
        })
    ping(): boolean {
        return true
    }
}

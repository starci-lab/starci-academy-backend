import type {
    ModuleMockMap, MockDefinition,
} from "../types"
import type {
    MockUser,
} from "../../types"

/** Builds N sequential demo users with derived emails. */
const buildUsers = (count: number): Array<MockUser> =>
    Array.from(
        {
            length: count,
        },
        (_unused, index) => {
            // 1-based id so the first user is #1 (matches lesson copy: "user #1")
            const id = index + 1
            return {
                id,
                name: `User ${id}`,
                email: `user${id}@starci.dev`,
            }
        },
    )

/** Lesson 0 -- useQuery + cache lifecycle: fixed list (names match the Playwright spec). */
const useQueryAndCacheLifecycle: MockDefinition = {
    seedUsers: [
        {
            id: 1, name: "Alice", email: "alice@starci.dev",
        },
        {
            id: 2, name: "Bob", email: "bob@starci.dev",
        },
        {
            id: 3, name: "Charlie", email: "charlie@starci.dev",
        },
        {
            id: 4, name: "Diana", email: "diana@starci.dev",
        },
        {
            id: 5, name: "Evan", email: "evan@starci.dev",
        },
    ],
}

/** Lesson 1 -- mutations + invalidation: small list the learner adds/removes from. */
const mutationsAndInvalidationGraph: MockDefinition = {
    seedUsers: [
        {
            id: 1, name: "Alice", email: "alice@starci.dev",
        },
        {
            id: 2, name: "Bob", email: "bob@starci.dev",
        },
    ],
}

/** Lesson 2 -- optimistic updates + rollback: needs user #1 to rename + roll back. */
const optimisticUpdatesWithRollback: MockDefinition = {
    seedUsers: [
        {
            id: 1, name: "Alice", email: "alice@starci.dev",
        },
        {
            id: 2, name: "Bob", email: "bob@starci.dev",
        },
        {
            id: 3, name: "Carol", email: "carol@starci.dev",
        },
    ],
}

/** Lesson 3 -- infinite query + pagination: 25 rows so "load more" pages multiple times. */
const infiniteQueryAndPagination: MockDefinition = {
    seedUsers: buildUsers(25),
}

/**
 * Mock definitions for module `4-server-state-with-tanstack-query`,
 * keyed by lesson display id.
 */
export const serverStateWithTanstackQueryMocks: ModuleMockMap = {
    "0-usequery-and-cache-lifecycle": useQueryAndCacheLifecycle,
    "1-mutations-and-invalidation-graph": mutationsAndInvalidationGraph,
    "2-optimistic-updates-with-rollback": optimisticUpdatesWithRollback,
    "3-infinite-query-and-pagination": infiniteQueryAndPagination,
}

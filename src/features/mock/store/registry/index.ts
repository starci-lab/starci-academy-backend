import type {
    MockDefinition, MockRegistry, ModuleMockMap,
} from "./types"
import type {
    MockUser,
} from "../types"
import {
    serverStateWithTanstackQueryMocks,
} from "./4-server-state-with-tanstack-query"
import {
    formMasteryMocks,
} from "./5-form-mastery-rhf-zod"

export * from "./types"

/** Module display id → that module's lesson mock map. */
const MODULE_MOCKS: Record<string, ModuleMockMap> = {
    "4-server-state-with-tanstack-query": serverStateWithTanstackQueryMocks,
    "5-form-mastery-rhf-zod": formMasteryMocks,
}

/** Fallback users used when a lesson has no registered mock definition. */
const FALLBACK_SEED_USERS: Array<MockUser> = [
    {
        id: 1, name: "Alice", email: "alice@starci.dev",
    },
    {
        id: 2, name: "Bob", email: "bob@starci.dev",
    },
    {
        id: 3, name: "Carol", email: "carol@starci.dev",
    },
]

/** Flattened registry keyed by `"<moduleDisplayId>/<lessonDisplayId>"`. */
const MOCK_REGISTRY: MockRegistry = Object.entries(MODULE_MOCKS).reduce(
    (registry, [moduleId,
        lessons]) => {
        // expand each module's lesson map into flat composite keys
        for (const [lessonId,
            definition] of Object.entries(lessons)) {
            registry[`${moduleId}/${lessonId}`] = definition
        }
        return registry
    },
    {
    } as MockRegistry,
)

/**
 * Resolves the mock definition for a module/lesson pair, falling back to a
 * generic 3-user seed when the lesson is not explicitly registered.
 *
 * @param moduleId - Module display id (e.g. `5-form-mastery-rhf-zod`).
 * @param lessonId - Lesson display id (e.g. `1-async-validation-with-debounce`).
 * @returns The matching definition, or a generic fallback seed.
 */
export const resolveMockDefinition = (
    moduleId: string,
    lessonId: string,
): MockDefinition => {
    // look up the explicit per-lesson definition first
    const definition = MOCK_REGISTRY[`${moduleId}/${lessonId}`]
    if (definition) {
        return definition
    }

    // unregistered lesson → generic fallback so the sandbox still renders
    return {
        seedUsers: FALLBACK_SEED_USERS,
    }
}

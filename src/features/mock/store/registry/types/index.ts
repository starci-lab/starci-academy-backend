import type {
    MockUser,
} from "../../types"

/**
 * Per-lesson mock definition. Each lesson under a module owns its own demo
 * data shape and seed, because lessons demonstrate different scenarios
 * (e.g. pagination needs many rows, username-availability needs a taken name).
 */
export interface MockDefinition {
    /** Users cloned into every fresh session for this lesson. */
    seedUsers: Array<MockUser>
}

/** A module's lessons keyed by lesson display id. */
export type ModuleMockMap = Record<string, MockDefinition>

/** The flat registry keyed by `"<moduleDisplayId>/<lessonDisplayId>"`. */
export type MockRegistry = Record<string, MockDefinition>

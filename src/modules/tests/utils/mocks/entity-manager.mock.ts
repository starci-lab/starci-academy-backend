import type {
    EntityManager,
} from "typeorm"

/**
 * A jest-backed stand-in for a TypeORM `SelectQueryBuilder`.
 *
 * Every chainable method returns the same builder so call chains like
 * `.setLock(...).where(...).getOne()` work; the terminal `getOne` / `getMany`
 * are plain `jest.fn` the test programs per-case.
 */
export interface QueryBuilderMock {
    /** Chainable: records the requested lock mode, returns the builder. */
    setLock: jest.Mock
    /** Chainable: records the root WHERE clause, returns the builder. */
    where: jest.Mock
    /** Chainable: records an additional AND clause, returns the builder. */
    andWhere: jest.Mock
    /** Chainable: records an eager join, returns the builder. */
    leftJoinAndSelect: jest.Mock
    /** Chainable: records an ordering, returns the builder. */
    orderBy: jest.Mock
    /** Chainable: records a row limit, returns the builder. */
    limit: jest.Mock
    /** Terminal: resolves the single row the test programmed (null by default). */
    getOne: jest.Mock
    /** Terminal: resolves the row list the test programmed (empty by default). */
    getMany: jest.Mock
}

/**
 * A jest-backed stand-in for the primary {@link EntityManager}.
 *
 * Defaults mirror the happy path so most tests only override the one method
 * they assert on:
 * - `transaction(cb)` immediately invokes `cb` with the SAME mock, so code
 *   wrapped in `entityManager.transaction(...)` runs inline without a real DB.
 * - `save(entity)` echoes the entity back (as a real save would).
 * - `create(_, data)` echoes the plain object back (no metadata hydration).
 * - `update(...)` resolves `{ affected: 1 }`.
 * - `findOne` resolves `null` until the test programs a return value.
 */
export interface EntityManagerMock {
    /** Loads a single entity; programmed per-test (resolves `null` by default). */
    findOne: jest.Mock
    /** Loads a single entity or throws; programmed per-test (resolves `null`). */
    findOneOrFail: jest.Mock
    /** Loads many entities; programmed per-test (resolves `[]` by default). */
    find: jest.Mock
    /** Loads `[rows, total]`; programmed per-test (resolves `[[], 0]` by default). */
    findAndCount: jest.Mock
    /** Existence check; programmed per-test (resolves `false` by default). */
    exists: jest.Mock
    /** Row count; programmed per-test (resolves `0` by default). */
    count: jest.Mock
    /** Removes the passed entity and echoes it back. */
    remove: jest.Mock
    /** Persists and echoes the passed entity back. */
    save: jest.Mock
    /** Builds an unsaved entity by echoing the passed plain object. */
    create: jest.Mock
    /** Partial update; resolves `{ affected: 1 }`. */
    update: jest.Mock
    /** Hard delete; resolves `{ affected: 1 }`. */
    delete: jest.Mock
    /** Atomic column increment; resolves `{ affected: 1 }`. */
    increment: jest.Mock
    /** Raw SQL escape hatch; programmed per-test (resolves `[]` by default). */
    query: jest.Mock
    /** Returns the shared {@link QueryBuilderMock} for lock/join style queries. */
    createQueryBuilder: jest.Mock
    /** Runs the callback inline with this same mock as the transactional manager. */
    transaction: jest.Mock
}

/**
 * Build a fresh {@link QueryBuilderMock} with every chainable method wired to
 * return the builder and the terminals resolving empty.
 *
 * @returns a standalone query-builder mock
 */
export const makeQueryBuilderMock = (): QueryBuilderMock => {
    // declare first so each chainable method can return the same instance
    const builder = {
    } as QueryBuilderMock

    // chainable methods all hand back the builder for fluent call chains
    builder.setLock = jest.fn(() => builder)
    builder.where = jest.fn(() => builder)
    builder.andWhere = jest.fn(() => builder)
    builder.leftJoinAndSelect = jest.fn(() => builder)
    builder.orderBy = jest.fn(() => builder)
    builder.limit = jest.fn(() => builder)

    // terminals resolve "nothing found" until a test programs them
    builder.getOne = jest.fn().mockResolvedValue(null)
    builder.getMany = jest.fn().mockResolvedValue([])

    return builder
}

/**
 * Build a fresh {@link EntityManagerMock} for a service unit test. Use it as the
 * value for the `getEntityManagerToken("primary")` provider so the SUT runs with
 * zero real database access.
 *
 * @returns a standalone entity-manager mock with happy-path defaults
 *
 * @example
 * const entityManager = makeEntityManagerMock()
 * entityManager.findOne.mockResolvedValueOnce(existingRow)
 * // ...
 * { provide: getEntityManagerToken("primary"), useValue: entityManager }
 */
export const makeEntityManagerMock = (): EntityManagerMock => {
    // one shared builder so `createQueryBuilder()` assertions stay simple
    const queryBuilder = makeQueryBuilderMock()

    const entityManager = {
        // default: "row not found" so loadOrCreate-style branches are explicit
        findOne: jest.fn().mockResolvedValue(null),
        // default: "row not found" — program a row or a rejection per-test
        findOneOrFail: jest.fn().mockResolvedValue(null),
        // default: empty list
        find: jest.fn().mockResolvedValue([]),
        // default: empty page — [rows, total]
        findAndCount: jest.fn().mockResolvedValue([
            [],
            0,
        ]),
        // default: row does not exist
        exists: jest.fn().mockResolvedValue(false),
        // default: zero rows
        count: jest.fn().mockResolvedValue(0),
        // default: removal echoes the entity back
        remove: jest.fn(async (entity: unknown) => entity),
        // default: persistence is a no-op that echoes the entity back
        save: jest.fn(async (entity: unknown) => entity),
        // default: `create` just returns the plain object it was handed
        create: jest.fn((_entity: unknown, data: unknown) => data),
        // default: one row affected
        update: jest.fn().mockResolvedValue({
            affected: 1,
        }),
        // default: one row affected
        delete: jest.fn().mockResolvedValue({
            affected: 1,
        }),
        // default: one row affected
        increment: jest.fn().mockResolvedValue({
            affected: 1,
        }),
        // default: no rows
        query: jest.fn().mockResolvedValue([]),
        // hand back the shared builder
        createQueryBuilder: jest.fn(() => queryBuilder),
    } as EntityManagerMock

    // run the transactional callback inline with this same manager so the code
    // under test executes exactly as it would, minus the real BEGIN/COMMIT
    entityManager.transaction = jest.fn(
        (callback: (manager: EntityManager) => Promise<unknown>) =>
            callback(entityManager as unknown as EntityManager),
    )

    return entityManager
}

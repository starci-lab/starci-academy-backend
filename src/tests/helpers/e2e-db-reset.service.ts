import {
    Injectable,
} from "@nestjs/common"
import {
    DataSource,
} from "typeorm"

/** One row of `pg_tables`, narrowed to the column {@link E2eDbResetService} reads. */
export interface PublicTableRow {
    /** Table name inside the `public` schema. */
    tablename: string
}

@Injectable()
/**
 * Truncates every table in the test database.
 *
 * Suite isolation cannot be left to each spec's own `afterEach`. Twenty of them
 * seed a course tree once in `beforeAll` and treat it as a read-only fixture,
 * truncating only `users` and `enrollments` afterwards -- which leaves the
 * courses, contents and challenges behind for whatever runs next. That stays
 * invisible until a later suite asserts on "the only challenge" and silently
 * reads a neighbour's fixture: the weekly-challenge suite failed exactly that
 * way, expecting its own "Weekly Featured Challenge" and getting
 * progress-query's "Challenge challenge-completed".
 *
 * Resetting centrally fixes every such suite at once and, more importantly, the
 * ones nobody has written yet -- a per-suite cleanup would have to be remembered
 * 48 times.
 *
 * It owns its OWN {@link DataSource} rather than borrowing the suite's: the
 * lifecycle hook that drives it runs after the spec file's `afterAll`, by which
 * point the suite has already closed its Nest app and every connection in it.
 * That also means the hook constructs this class directly -- a Jest setup file
 * has no container to resolve it from -- while `TestHelpersModule` still exports
 * it so a spec can inject it and reset mid-test.
 */
export class E2eDbResetService {
    /**
     * Connection details come from the same `POSTGRESQL_PRIMARY_*` variables
     * `E2eStackService` writes when it boots the container, so this service
     * always points at the database the lane is actually running against.
     */
    private buildDataSource(host: string): DataSource {
        return new DataSource({
            type: "postgres",
            host,
            port: Number(process.env.POSTGRESQL_PRIMARY_PORT),
            username: process.env.POSTGRESQL_PRIMARY_USERNAME,
            password: process.env.POSTGRESQL_PRIMARY_PASSWORD,
            database: process.env.POSTGRESQL_PRIMARY_DATABASE,
            // no entities and no schema sync -- this connection only issues one
            // TRUNCATE and closes
            synchronize: false,
        })
    }

    /**
     * Truncate every table in the `public` schema, restarting identities and
     * cascading through foreign keys.
     *
     * Table names are read from `pg_tables` rather than a hand-kept list, so a
     * newly added entity is covered the day it appears. A no-op when the lane
     * booted no database.
     */
    public async reset(): Promise<void> {
        const host = process.env.POSTGRESQL_PRIMARY_HOST
        if (!host) {
            return
        }

        const dataSource = await this.buildDataSource(host).initialize()
        try {
            const rows: Array<PublicTableRow> = await dataSource.query(
                "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
            )
            if (rows.length === 0) {
                return
            }
            const tables = rows
                .map((row) => `"${row.tablename}"`)
                .join(", ")
            await dataSource.query(
                `TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`,
            )
        } finally {
            await dataSource.destroy().catch(() => undefined)
        }
    }
}

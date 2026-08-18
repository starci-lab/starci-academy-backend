import {
    DataSource,
} from "typeorm"

async function main(): Promise<void> {
    const host = process.env.POSTGRESQL_PRIMARY_HOST ?? "localhost"
    const port = Number(process.env.POSTGRESQL_PRIMARY_PORT ?? 5432)
    const username = process.env.POSTGRESQL_PRIMARY_USERNAME ?? "postgres"
    const password = process.env.POSTGRESQL_PRIMARY_PASSWORD ?? ""
    const database = process.env.POSTGRESQL_PRIMARY_DATABASE ?? "starci-academy"

    const dataSource = new DataSource({
        type: "postgres",
        host,
        port,
        username,
        password,
        database,
        migrations: [
            "src/modules/databases/postgresql/primary/migrations/*.ts",
        ],
        migrationsTableName: "migrations",
        migrationsTransactionMode: "each",
        logging: true,
    })

    await dataSource.initialize()
    const executed = await dataSource.runMigrations()
    await dataSource.destroy()

    if (executed.length === 0) {
        console.log("No pending migrations.")
        return
    }

    console.log(`Ran ${executed.length} migration(s):`)
    for (const migration of executed) {
        console.log(`- ${migration.name}`)
    }
}

main().catch((error: unknown) => {
    console.error(error)
    process.exit(1)
})

import {
    CommandRunner, Option, SubCommand,
} from "nest-commander"
import {
    InvalidPostgresUrlException,
} from "@modules/platform/exceptions/errors/cli/invalid-postgres-url"
import {
    InvalidUrlException,
} from "@modules/platform/exceptions/errors/cli/invalid-url"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    mkdtemp,
} from "node:fs/promises"
import {
    tmpdir,
} from "node:os"
import path from "node:path"
import {
    AsyncService,
} from "@modules/lib/mixin/async.service"
import {
    ExecaService,
} from "@modules/integrations/execa/execa.service"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    v4
} from "uuid"
import type {
    PgSyncCommandOptions,
} from "./types/pg-sync"

@SubCommand({
    name: "pg-sync",
    description: "Sync PostgreSQL database",
})
/**
 * Clone one Postgres into another via local dump+restore. Refuses identical
 * URLs so a typo cannot wipe the source. Temp dump stays on disk (not S3) --
 * this is a clone tool, not the encrypted backup cron.
 */
export class PgSyncCommand extends CommandRunner {
    constructor(
        private readonly winstonService: WinstonService,
        private readonly asyncService: AsyncService,
        private readonly execaService: ExecaService,

    ) {
        super()
    }

    /**
     * Parse the source URL
     * @param value - The URL of the source PostgreSQL database
     * @returns The URL of the source PostgreSQL database
     */
    @Option({
        flags: "-s, --source-url <source-url>",
        description: "The URL of the PostgreSQL database",
        // NO CREDENTIAL LITERAL HERE. A Postgres URL carries its password
        // inline, so the default is supplied by the environment
        // (`PG_SYNC_SOURCE_URL`, or its `_FILE` pointer) and is empty when that
        // is unset -- an unconfigured run then stops at the guard in `run()`
        // instead of silently pointing a dump at whatever host a checked-in
        // connection string happened to name.
        defaultValue: envConfig().cli.pgSync.sourceUrl,
        required: true,
    })
    parseSourceUrl(
        value: string
    ): string {
        return value.trim()
    }

    /**
     * Parse the destination URL
     * @param value - The URL of the destination PostgreSQL database
     * @returns The URL of the destination PostgreSQL database
     */
    @Option({
        flags: "-d, --destination-url <destination-url>",
        description: "The URL of the destination PostgreSQL database",
        // Same rule as `--source-url`: the default is environment-supplied
        // (`PG_SYNC_DESTINATION_URL`), never a literal credential.
        defaultValue: envConfig().cli.pgSync.destinationUrl,
        required: true,
    })
    parseDestinationUrl(
        value: string
    ): string {
        return value.trim()
    }

    /**
     * Run the command
     * @param _ - The passed parameters
     * @param options - The options for the command
     * @returns void
     */
    async run(
        _: Array<string>,
        options: PgSyncCommandOptions,
    ): Promise<void> {
        const {
            sourceUrl, destinationUrl,
        } = options

        if (!sourceUrl) {
            this.winstonService.log(
                WinstonLog.CommandError,
                {
                    error: "Missing source URL. Pass --source-url <postgres://...>",
                },
            )
            process.exit(1)
        }
        if (!destinationUrl) {
            this.winstonService.log(
                WinstonLog.CommandError,
                {
                    error: "Missing destination URL. Pass --destination-url <postgres://...>",
                },
            )
            process.exit(1)
        }

        const [, error] = await this.asyncService.resolveTuple(
            (
                async () => {
                    this.assertPostgresConnectionUrl(sourceUrl)
                    this.assertPostgresConnectionUrl(destinationUrl)
                }
            )()
        )
        if (error) {
            this.winstonService.log(
                WinstonLog.CommandError,
                {
                    error: error.message,
                },
            )
            process.exit(1)
        }
        if (sourceUrl === destinationUrl) {
            this.winstonService.log(
                WinstonLog.CommandError,
                {
                    error: "Source and destination URLs must not be the same.",
                },
            )
            process.exit(1)
        }
        /**
         * Create a temporary directory for the sync
         */
        const workDir = await mkdtemp(
            path.join(
                tmpdir(),
                "starci-pg-sync-",
            ),
        )
        /**
         * The path to the dump file
         */
        const dumpPath = path.join(
            workDir,
            v4(),
        )
        /**
         * Run the pg_dump command
         */
        const [, dumpError] = await this.asyncService.resolveTuple(
            (
                async () => {
                    this.winstonService.log(
                        WinstonLog.CommandSuccess,
                        {
                            message: "Running pg_dump against source...",
                        },
                    )
                    await this.execaService.exec({
                        command: "pg_dump",
                        args: [
                            "--format=custom",
                            "--file",
                            dumpPath,
                            "--dbname",
                            sourceUrl,
                        ],
                        timeoutMs: 10000,
                    })
                }
            )()
        )
        if (dumpError) {
            this.winstonService.log(
                WinstonLog.CommandError,
                {
                    error: dumpError.message,
                },
            )
            process.exit(1)
        }
        /**
         * Run the pg_restore command
         */
        const [, restoreError] = await this.asyncService.resolveTuple(
            (
                async () => {
                    this.winstonService.log(
                        WinstonLog.CommandSuccess,
                        {
                            message: "Running pg_restore into destination...",
                        },
                    )
                    await this.execaService.exec({
                        command: "pg_restore",
                        args: [
                            "--dbname",
                            destinationUrl,
                            "--clean",
                            "--if-exists",
                            "--no-owner",
                            dumpPath,
                        ],
                        timeoutMs: 10000,
                    })
                }
            )()
        )
        if (restoreError) {
            this.winstonService.log(
                WinstonLog.CommandError,
                {
                    error: restoreError.message,
                },
            )
            process.exit(1)
        }

        process.exit(0)
    }

    /**
     * Assert the PostgreSQL connection URL
     * @param urlString - The URL of the PostgreSQL database
     * @returns void
     */
    private assertPostgresConnectionUrl(
        urlString: string,
    ): void {
        let parsed: URL
        try {
            parsed = new URL(urlString)
        } catch {
            throw new InvalidUrlException({
                urlString,
            })
        }
        const scheme = parsed.protocol.replace(
            ":",
            "",
        )
        if(scheme !== "postgresql" && scheme !== "postgres") {
            throw new InvalidPostgresUrlException({
                urlString,
            })
        }
    }
}


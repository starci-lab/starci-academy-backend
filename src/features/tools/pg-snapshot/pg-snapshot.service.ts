import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    mkdir,
    stat,
} from "fs/promises"
import {
    join,
} from "path"
import {
    envConfig,
} from "@modules/env"
import {
    ExecaService,
} from "@modules/execa"
import {
    ArtifactType,
    ToolsStoreService,
} from "../store"
import {
    assertPostgresConnectionUrl,
    slugifyForFilename,
} from "../utils"
import type {
    DumpOneParams,
    PgSnapshotItemResult,
    PgSnapshotParams,
    PgSnapshotResult,
} from "./types"

@Injectable()
/**
 * Dumps a list of (cloud) PostgreSQL databases to local `.dump` files.
 *
 * Each target is dumped independently with `pg_dump --format=custom` so a single
 * failing connection does not abort the whole run; the per-target outcome is
 * collected and returned. Files land under `<TOOLS_SNAPSHOT_DIR>/pg` so the
 * operator can inspect or restore them by hand.
 */
export class PgSnapshotService {
    private readonly logger = new Logger(PgSnapshotService.name)

    constructor(
        private readonly execaService: ExecaService,
        private readonly toolsStoreService: ToolsStoreService,
    ) {}

    /**
     * Dump every requested target to a timestamped file.
     *
     * @param params - The list of databases to snapshot.
     * @returns The output directory and a per-target outcome list.
     */
    async execute(
        {
            targets,
        }: PgSnapshotParams,
    ): Promise<PgSnapshotResult> {
        // all dumps for this run share one directory under the snapshot root
        const directory = join(
            envConfig().tools.snapshotDir,
            "pg",
        )
        // ensure the destination exists before pg_dump tries to write into it
        await mkdir(
            directory,
            {
                recursive: true,
            },
        )

        // shared run timestamp keeps every file from the same run grouped/sortable
        const runStamp = Date.now()
        const items: Array<PgSnapshotItemResult> = []

        // dump targets sequentially — pg_dump is IO/CPU heavy and parallel dumps
        // against the same operator machine rarely help and complicate logging
        for (const target of targets) {
            items.push(await this.dumpOne({
                target,
                directory,
                runStamp,
            }))
        }

        return {
            directory,
            items,
        }
    }

    /**
     * Dump a single target, never throwing — failures become a result entry.
     */
    private async dumpOne(
        {
            target,
            directory,
            runStamp,
        }: DumpOneParams,
    ): Promise<PgSnapshotItemResult> {
        try {
            // reject malformed/non-postgres URLs before spawning pg_dump
            assertPostgresConnectionUrl(target.url)

            // filesystem-safe, collision-resistant filename: <slug>-<runStamp>.dump
            const file = join(
                directory,
                `${slugifyForFilename(target.name)}-${runStamp}.dump`,
            )

            // custom format is compact and restorable via pg_restore
            await this.execaService.exec({
                command: "pg_dump",
                args: [
                    "--format=custom",
                    "--file",
                    file,
                    "--dbname",
                    target.url,
                ],
                // cloud dumps can be large/slow — allow up to 10 minutes
                timeoutMs: 10 * 60 * 1000,
            })

            // confirm the dump actually produced bytes (empty file = silent failure)
            const { size } = await stat(file)

            // register the dump as a local artifact (no target → local-only)
            const artifact = this.toolsStoreService.createArtifact({
                type: ArtifactType.PgSnapshot,
                label: target.name,
                localPath: file,
                meta: {
                    sizeBytes: size,
                },
            })

            this.logger.log(
                `Snapshotted "${target.name}" → ${file} (${size} bytes)`,
            )

            return {
                name: target.name,
                ok: true,
                file,
                sizeBytes: size,
                artifactId: artifact.id,
            }
        } catch (error) {
            // capture the failure for this target and continue with the rest
            const message = error instanceof Error ? error.message : String(error)
            this.logger.error(
                `Snapshot failed for "${target.name}": ${message}`,
            )
            return {
                name: target.name,
                ok: false,
                error: message,
            }
        }
    }
}

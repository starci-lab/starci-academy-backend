import {
    Injectable,
} from "@nestjs/common"
import {
    mkdtemp,
    mkdir,
    rm,
} from "fs/promises"
import {
    tmpdir,
} from "os"
import {
    join,
} from "path"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    ExecaService,
} from "@modules/integrations/execa/execa.service"
import {
    BackupEncryptionPasswordNotSetException,
} from "@modules/platform/exceptions/errors/backup/backup-encryption-password-not-set"
import {
    ToolsTargetReferenceInvalidException,
} from "@modules/platform/exceptions/errors/tools/target"
import {
    ArtifactType,
} from "../store/enums/store"
import {
    ToolsStoreService,
} from "../store/tools-store.service"
import {
    SyncService,
} from "../sync/sync.service"
import {
    assertPostgresConnectionUrl,
    slugifyForFilename,
} from "../utils/postgres-url"
import type {
    PgBackupParams,
    PgBackupResult,
} from "./types/pg-backup"

@Injectable()
/**
 * Backs up one PostgreSQL database to a local disk as an encrypted artifact,
 * registers it, and (optionally) syncs it to a saved S3 target.
 *
 * Flow (local-first): pg_dump -> gzip -> openssl enc, writing the final encrypted
 * file onto the operator's chosen disk (kept as the artifact). Intermediate
 * dump/gz files go to a throwaway temp dir. The artifact stays on disk so it can
 * be re-synced later. Encryption is mandatory (`BACKUP_ENCRYPT_PASSWORD`).
 */
export class PgBackupService {
    constructor(
        private readonly execaService: ExecaService,
        private readonly toolsStoreService: ToolsStoreService,
        private readonly syncService: SyncService,
        private readonly winstonService: WinstonService,
    ) {}

    /**
     * Dump, compress, encrypt to disk and optionally sync the artifact.
     *
     * @param params - Connection URL, disk path, artifact name, target/key.
     * @returns The artifact id, local path, encrypted file path and sync result.
     */
    async execute(
        {
            postgresUrl,
            diskPath,
            artifactBaseName,
            targetIds,
            keyPrefix,
        }: PgBackupParams,
    ): Promise<PgBackupResult> {
        // reject malformed/non-postgres URLs before spawning pg_dump
        assertPostgresConnectionUrl(postgresUrl)

        // encryption is mandatory -- refuse rather than write a plaintext dump
        const encryptPassword = envConfig().backup.encrypt.password
        if (!encryptPassword) {
            throw new BackupEncryptionPasswordNotSetException({
            })
        }
        // validate every target up-front so we fail before the heavy dump
        for (const targetId of targetIds) {
            if (!this.toolsStoreService.getTarget(targetId)) {
                throw new ToolsTargetReferenceInvalidException({
                    targetId,
                })
            }
        }

        // per-run artifact folder on the operator's chosen disk, kept afterwards
        const stamp = Date.now()
        const artifactDir = join(
            diskPath,
            "pg-backup",
            `${slugifyForFilename(artifactBaseName)}-${stamp}`,
        )
        await mkdir(artifactDir,
            {
                recursive: true,
            })
        const encFile = join(artifactDir,
            `${artifactBaseName}.dump.gz.enc`)

        // intermediates (dump + gz) live in a throwaway temp dir, cleaned up
        const tempDir = await mkdtemp(join(tmpdir(),
            `${artifactBaseName}-`))
        const dumpPath = join(tempDir,
            `${artifactBaseName}.dump`)
        const gzPath = `${dumpPath}.gz`

        try {
            // 1. pg_dump -> custom-format file
            await this.execaService.exec({
                command: "pg_dump",
                args: [
                    "--format=custom",
                    "--file",
                    dumpPath,
                    "--dbname",
                    postgresUrl,
                ],
                timeoutMs: 10 * 60 * 1000,
            })
            // 2. gzip -> file (stream stdout to disk; avoid buffering large dumps)
            await this.execaService.execToFile({
                command: "gzip",
                args: [
                    "-c",
                    dumpPath,
                ],
                stdoutPath: gzPath,
                timeoutMs: 10 * 60 * 1000,
            })
            // 3. openssl AES-256-CBC encrypt straight onto the artifact disk; the
            //    password is passed via env so it never appears in the arg list
            await this.execaService.exec({
                command: "openssl",
                args: [
                    "enc",
                    "-aes-256-cbc",
                    "-salt",
                    "-pbkdf2",
                    "-in",
                    gzPath,
                    "-out",
                    encFile,
                    "-pass",
                    "env:BACKUP_ENCRYPT_PASSWORD",
                ],
                timeoutMs: 10 * 60 * 1000,
                env: {
                    // spawn inherit: openssl reads BACKUP_ENCRYPT_PASSWORD from the
                    // child env; spreading process.env is not a config read.
                    // eslint-disable-next-line no-restricted-syntax
                    ...process.env,
                    BACKUP_ENCRYPT_PASSWORD: encryptPassword,
                },
            })
        } finally {
            // always remove the plaintext intermediates
            await rm(tempDir,
                {
                    recursive: true,
                    force: true,
                })
        }

        // register the kept artifact (the encrypted file's folder)
        const resolvedPrefix = (keyPrefix ?? `backups/${slugifyForFilename(artifactBaseName)}`).replace(/\/+$/,
            "")
        const artifact = this.toolsStoreService.createArtifact({
            type: ArtifactType.PgBackup,
            label: artifactBaseName,
            localPath: artifactDir,
            keyPrefix: resolvedPrefix,
            targetIds,
            meta: {
                encFile,
            },
        })

        this.winstonService.log(WinstonLog.ToolsArtifactBuilt,
            {
                op: "tools.pg-backup.built",
                meta: {
                    artifactId: artifact.id,
                    encFile,
                },
            })

        // sync to cloud only when at least one target was provided
        const synced = targetIds.length > 0
            ? await this.syncService.syncArtifact(artifact.id)
            : null

        return {
            artifactId: artifact.id,
            localPath: artifactDir,
            encFile,
            synced,
        }
    }
}

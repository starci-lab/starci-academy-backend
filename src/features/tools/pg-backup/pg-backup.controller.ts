import {
    Body,
    Controller,
    HttpCode,
    Post,
    UseGuards,
} from "@nestjs/common"
import {
    ApiOperation,
    ApiResponse,
    ApiTags,
} from "@nestjs/swagger"
import {
    LocalOnlyGuard,
} from "../guards"
import {
    toolsRoutes,
} from "../constants"
import {
    PgBackupRequest,
} from "./dtos"
import {
    PgBackupService,
} from "./pg-backup.service"
import type {
    PgBackupResult,
} from "./types"

@ApiTags(toolsRoutes.pg.tag)
@Controller(
    {
        path: toolsRoutes.pg.tag,
        version: "1",
    },
)
/**
 * Local-only controller for backing up a database to disk + optionally cloud.
 */
export class PgBackupController {
    constructor(
        private readonly pgBackupService: PgBackupService,
    ) {}

    @UseGuards(LocalOnlyGuard)
    @ApiOperation({
        summary: "Back up a PostgreSQL database to a local disk (encrypted) + sync",
        description:
            "Runs pg_dump → gzip → openssl enc onto the given disk path (kept as a " +
            "re-syncable artifact), then optionally uploads to a saved target. " +
            "Requires BACKUP_ENCRYPT_PASSWORD. Local-only: returns 404 in production.",
    })
    @ApiResponse({
        status: 200,
        description: "The artifact id, local path, encrypted file and sync result.",
    })
    @Post(toolsRoutes.pg.backup)
    @HttpCode(200)
    async backup(
        @Body()
            body: PgBackupRequest,
    ): Promise<PgBackupResult> {
        return this.pgBackupService.execute({
            postgresUrl: body.postgresUrl,
            diskPath: body.diskPath,
            artifactBaseName: body.artifactBaseName,
            targetIds: body.targetIds ?? [],
            keyPrefix: body.keyPrefix,
        })
    }
}

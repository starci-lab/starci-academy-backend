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
} from "../guards/local-only.guard"
import {
    toolsRoutes,
} from "../constants/routes"
import {
    PgSnapshotRequest,
} from "./dtos/pg-snapshot.request"
import {
    PgSnapshotService,
} from "./pg-snapshot.service"
import type {
    PgSnapshotResult,
} from "./types/pg-snapshot"

@ApiTags(toolsRoutes.pg.tag)
@Controller(
    {
        path: toolsRoutes.pg.tag,
        version: "1",
    },
)
/**
 * Local-only controller for dumping a list of cloud databases to local files.
 */
export class PgSnapshotController {
    constructor(
        private readonly pgSnapshotService: PgSnapshotService,
    ) {}

    @UseGuards(LocalOnlyGuard)
    @ApiOperation({
        summary: "Snapshot a list of cloud PostgreSQL databases to local files",
        description:
            "Runs pg_dump (custom format) against each provided connection URL " +
            "and writes the resulting .dump files under TOOLS_SNAPSHOT_DIR/pg. " +
            "Local-only: returns 404 in production.",
    })
    @ApiResponse({
        status: 200,
        description: "Per-target snapshot outcomes.",
    })
    @Post(toolsRoutes.pg.snapshot)
    @HttpCode(200)
    async snapshot(
        @Body()
            body: PgSnapshotRequest,
    ): Promise<PgSnapshotResult> {
        return this.pgSnapshotService.execute({
            targets: body.targets,
        })
    }
}

import {
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    Post,
    UseGuards,
} from "@nestjs/common"
import {
    ApiOperation,
    ApiTags,
} from "@nestjs/swagger"
import {
    rm,
} from "fs/promises"
import {
    ToolsArtifactNotFoundException,
} from "@modules/platform/exceptions/errors/tools/artifact"
import {
    LocalOnlyGuard,
} from "../guards/local-only.guard"
import {
    toolsRoutes,
} from "../constants/routes"
import {
    ToolsStoreService,
} from "../store/tools-store.service"
import {
    SyncService,
} from "../sync/sync.service"

@ApiTags(toolsRoutes.artifacts.tag)
@UseGuards(LocalOnlyGuard)
@Controller(
    {
        path: toolsRoutes.artifacts.tag,
        version: "1",
    },
)
/**
 * Local-only controller for the artifact registry: list, re-sync, delete.
 */
export class ArtifactsController {
    constructor(
        private readonly toolsStoreService: ToolsStoreService,
        private readonly syncService: SyncService,
    ) {}

    @ApiOperation({
        summary: "List local artifacts and their sync state",
    })
    @Get()
    list() {
        return this.toolsStoreService.listArtifacts()
    }

    @ApiOperation({
        summary: "Re-sync an existing local artifact to its target",
        description:
            "Re-uploads the kept local artifact to its configured target without " +
            "recomputing it. Fails if the artifact has no target/keyPrefix.",
    })
    @Post(`:id/${toolsRoutes.artifacts.resync}`)
    @HttpCode(200)
    resync(
        @Param("id")
            id: string,
    ) {
        return this.syncService.syncArtifact(id)
    }

    @ApiOperation({
        summary: "Delete an artifact (registry row + local files)",
    })
    @Delete(":id")
    async delete(
        @Param("id")
            id: string,
    ) {
        // look up first so we can remove the on-disk files too
        const artifact = this.toolsStoreService.getArtifact(id)
        if (!artifact) {
            throw new ToolsArtifactNotFoundException({
                artifactId: id,
            })
        }
        // drop the local files/dir, then the registry row
        await rm(artifact.localPath,
            {
                recursive: true,
                force: true,
            })
        this.toolsStoreService.deleteArtifact(id)
        return {
            id,
            deleted: true,
        }
    }
}

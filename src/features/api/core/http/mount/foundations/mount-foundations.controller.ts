import {
    Controller,
    Get,
    NotFoundException,
    Param,
    Res,
} from "@nestjs/common"
import {
    ApiOperation,
} from "@nestjs/swagger"
import type {
    Response,
} from "express"
import {
    httpConfig,
} from "../../http"
import {
    MountFoundationsService,
} from "./mount-foundations.service"

/**
 * Serves static files from `.mount/data/foundations` (external-link targets).
 */
@Controller({
    path: `${httpConfig().mount().tags}/${httpConfig().mount().foundations().path}`,
    version: "1",
})
export class MountFoundationsController {
    constructor(
        private readonly mountFoundationsService: MountFoundationsService,
    ) {}

    @ApiOperation({
        summary: "Get a foundations mount file",
    })
    @Get("*path")
    async getFile(
        @Param("path") pathSegments: Array<string> | string,
        @Res() res: Response,
    ): Promise<void> {
        const segments = Array.isArray(pathSegments)
            ? pathSegments
            : [pathSegments]
        const relativePath = segments.join("/")

        try {
            const {
                absolutePath,
                buffer,
            } = await this.mountFoundationsService.readFile(relativePath)

            res.type(this.resolveContentType(absolutePath))
            res.send(buffer)
        } catch {
            throw new NotFoundException()
        }
    }

    private resolveContentType(
        filePath: string,
    ): string {
        if (filePath.endsWith(".md")) {
            return "text/markdown; charset=utf-8"
        }
        if (filePath.endsWith(".html")) {
            return "text/html; charset=utf-8"
        }
        if (filePath.endsWith(".json")) {
            return "application/json; charset=utf-8"
        }
        return "application/octet-stream"
    }
}

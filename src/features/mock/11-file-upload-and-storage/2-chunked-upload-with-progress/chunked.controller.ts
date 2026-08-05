import {
    Controller,
    Post,
    Get,
    Patch,
    Param,
    Query,
    Body,
    Req,
    ParseIntPipe,
    UseInterceptors,
} from "@nestjs/common"
import {
    ApiOperation,
    ApiTags,
} from "@nestjs/swagger"
import type {
    Request,
} from "express"
import {
    FileStoreService,
} from "../../file-store/file-store.service"
import type {
    InitChunkResult,
    ChunkStatus,
    FinalizeResult,
} from "../../file-store/types"
import {
    MockDelayInterceptor,
} from "../../interceptors/mock-delay.interceptor"
import {
    readRawBody,
} from "../../utils/read-raw-body"
import {
    InitUploadDto,
} from "./dtos/init-upload"

/** Per-chunk byte cap (a generous multiple of the 256 KB chunk size). */
const MAX_CHUNK_BYTES = 2 * 1024 * 1024

@ApiTags("mock")
@Controller()
/**
 * Mock controller for lesson `2-chunked-upload-with-progress`.
 *
 * Implements the init -> PATCH-chunks -> finalize flow with resume support: the
 * client slices the file by the server-returned `chunkSize`, PATCHes each raw
 * slice at its index, and the server tracks received/missing indices so an
 * interrupted upload can resume. The chunk PATCH carries no artificial delay so
 * the per-chunk progress bar stays smooth; init/status/finalize keep the delay.
 * Mounted at the bare origin (the frontend uses `new URL(VITE_API_BASE).origin`).
 */
export class ChunkedController {
    constructor(private readonly store: FileStoreService) {}

    /**
     * Creates an upload session and returns the slicing parameters.
     */
    @ApiOperation({
        summary: "Init a chunked-upload session",
    })
    @UseInterceptors(MockDelayInterceptor)
    @Post("uploads/init")
    init(
        @Body() body: InitUploadDto,
    ): InitChunkResult {
        return this.store.initChunkSession(body.filename,
            body.size)
    }

    /**
     * Returns the received/missing chunk bitmaps for resume.
     */
    @ApiOperation({
        summary: "Get chunked-upload status",
    })
    @UseInterceptors(MockDelayInterceptor)
    @Get("uploads/:id/status")
    status(
        @Param("id") id: string,
    ): ChunkStatus {
        return this.store.getChunkStatus(id)
    }

    /**
     * Stores one raw-binary chunk at `index`. No artificial delay so per-chunk
     * upload progress reflects real byte transfer.
     */
    @ApiOperation({
        summary: "Upload one chunk",
    })
    @Patch("uploads/:id/chunks")
    async patchChunk(
        @Param("id") id: string,
        @Query("index",
            ParseIntPipe) index: number,
        @Req() request: Request,
    ): Promise<void> {
        const buffer = await readRawBody(request,
            MAX_CHUNK_BYTES)
        this.store.putChunk(id,
            index,
            buffer)
    }

    /**
     * Assembles the chunks, computes the SHA-256, and returns file metadata.
     */
    @ApiOperation({
        summary: "Finalize a chunked upload",
    })
    @UseInterceptors(MockDelayInterceptor)
    @Post("uploads/:id/finalize")
    finalize(
        @Param("id") id: string,
    ): FinalizeResult {
        return this.store.finalizeChunkSession(id)
    }
}

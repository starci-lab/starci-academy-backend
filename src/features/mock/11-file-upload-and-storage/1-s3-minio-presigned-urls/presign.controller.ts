import {
    Controller,
    Post,
    Get,
    Put,
    Param,
    Body,
    Req,
    Res,
    UseInterceptors,
} from "@nestjs/common"
import {
    ApiOperation,
    ApiTags,
} from "@nestjs/swagger"
import type {
    Request,
    Response,
} from "express"
import {
    createHash,
} from "crypto"
import {
    FileStoreService,
} from "../../file-store"
import {
    MockDelayInterceptor,
} from "../../interceptors"
import {
    readRawBody,
    resolveRequestOrigin,
} from "../../utils"
import {
    PresignPutDto,
} from "./dtos"
import type {
    PresignPutResponse,
    PresignGetResponse,
} from "./types"

/** Cosmetic lifetime advertised for every signed URL (15 minutes). */
const URL_TTL_SECONDS = 15 * 60

/** Per-object byte cap for a presigned PUT (10 MB). */
const MAX_OBJECT_BYTES = 10 * 1024 * 1024

@ApiTags("mock")
@Controller()
/**
 * Mock controller for lesson `1-s3-minio-presigned-urls`.
 *
 * Emulates the S3/MinIO presigned-URL round-trip entirely in-memory. The two
 * JSON endpoints (`/presign/put`, `/presign/get/:key`) hand out absolute URLs
 * pointing back at this service; the browser then PUTs the bytes to and GETs
 * them from `/presign/object/:key`, which stores and replays them so the
 * lesson's image preview actually renders. Mounted at the bare origin because
 * the lesson frontend talks to `new URL(VITE_API_BASE).origin`.
 */
export class PresignController {
    constructor(private readonly store: FileStoreService) {}

    /**
     * Signs a short-lived PUT URL for an object the client is about to upload.
     */
    @ApiOperation({
        summary: "Sign a PUT URL",
    })
    @UseInterceptors(MockDelayInterceptor)
    @Post("presign/put")
    signPut(
        @Body() body: PresignPutDto,
        @Req() request: Request,
    ): PresignPutResponse {
        const key = this.store.generateObjectKey(body.filename)

        return {
            key,
            url: this.objectUrl(request,
                key),
            method: "PUT",
            expiresInSeconds: URL_TTL_SECONDS,
            filename: body.filename,
        }
    }

    /**
     * Signs a short-lived GET URL for reading a previously-uploaded object.
     */
    @ApiOperation({
        summary: "Sign a GET URL",
    })
    @UseInterceptors(MockDelayInterceptor)
    @Get("presign/get/:key")
    signGet(
        @Param("key") key: string,
        @Req() request: Request,
    ): PresignGetResponse {
        return {
            url: this.objectUrl(request,
                key),
            key,
            expiresInSeconds: URL_TTL_SECONDS,
        }
    }

    /**
     * Stores the raw bytes a client PUTs to a signed URL. No artificial delay so
     * the upload itself stays snappy; returns a content-hash ETag like S3/MinIO.
     */
    @ApiOperation({
        summary: "Store object bytes (signed PUT target)",
    })
    @Put("presign/object/:key")
    async putObject(
        @Param("key") key: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<void> {
        const buffer = await readRawBody(request,
            MAX_OBJECT_BYTES)
        const contentType = request.headers["content-type"] ?? "application/octet-stream"

        // derive a display filename from the key's trailing segment
        const filename = key.split("/").at(-1) ?? "file"
        this.store.putObject(key,
            buffer,
            contentType,
            filename)

        // S3/MinIO answer a PUT with a quoted MD5 ETag of the body
        const etag = `"${createHash("md5").update(buffer).digest("hex")}"`
        response.setHeader("ETag",
            etag)
        response.status(200).end()
    }

    /**
     * Replays a stored object's bytes with its original content-type so the
     * lesson's `<img>` preview (signed GET URL) renders. No artificial delay.
     */
    @ApiOperation({
        summary: "Read object bytes (signed GET target)",
    })
    @Get("presign/object/:key")
    getObject(
        @Param("key") key: string,
        @Res() response: Response,
    ): void {
        const object = this.store.getObject(key)

        response.setHeader("Content-Type",
            object.contentType)
        response.setHeader("Content-Length",
            object.buffer.length)
        response.send(object.buffer)
    }

    /** Builds the absolute, percent-encoded URL for an object key. */
    private objectUrl(request: Request, key: string): string {
        const origin = resolveRequestOrigin(request)
        // encode the key (it contains "/") so it stays a single path segment
        return `${origin}/presign/object/${encodeURIComponent(key)}`
    }
}

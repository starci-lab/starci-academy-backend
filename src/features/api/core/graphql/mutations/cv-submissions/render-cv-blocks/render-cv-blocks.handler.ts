import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    CvBlocksEntity,
} from "@modules/databases/postgresql/primary/entities/cv-blocks.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    CvDocumentNotFoundException,
} from "@modules/platform/exceptions/errors/cv/cv-document-not-found"
import {
    CvLatexCompileFailedException,
} from "@modules/platform/exceptions/errors/cv/cv-latex-compile-failed"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    S3Provider,
} from "@modules/integrations/s3/enums/s3"
import {
    S3BuildService,
} from "@modules/integrations/s3/s3-build.service"
import {
    S3UploadService,
} from "@modules/integrations/s3/s3-upload.service"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    execFile,
} from "node:child_process"
import {
    mkdtemp,
    readFile,
    rm,
    writeFile,
} from "node:fs/promises"
import {
    tmpdir,
} from "node:os"
import {
    join,
} from "node:path"
import {
    promisify,
} from "node:util"
import {
    EntityManager,
} from "typeorm"
import {
    RenderCvBlocksCommand,
} from "./render-cv-blocks.command"
import {
    RenderCvBlocksResponseData,
} from "./graphql-types/response"
import {
    CvExportFormat,
} from "./cv-export-format.enum"

const execFileAsync = promisify(execFile)

/** Hard cap on a single compile (a runaway/looping LaTeX source can't hang a worker). */
const TECTONIC_TIMEOUT_MS = 60_000
/** Max stdout/stderr captured from tectonic (its log can be chatty on errors). */
const TECTONIC_MAX_BUFFER = 16 * 1024 * 1024

@CommandHandler(RenderCvBlocksCommand)
@Injectable()
/**
 * Handler for `renderCvBlocks` -- SYNCHRONOUS compile of a block-editor CV's
 * **LaTeX source** to a PDF. The FE builds the `.tex` (from the block document,
 * or the user's own edits to it) and sends it here; this handler compiles it
 * with **`tectonic`** (the self-contained LaTeX engine already in the `core`
 * Docker image), uploads the PDF to MinIO, and returns a fresh presigned GET URL.
 * Ownership is enforced (the `cv_blocks` row must belong to the caller).
 *
 * PIVOT (2026-07-18): render is **full LaTeX** again -- no HTML/Puppeteer/DOCX.
 * The `.tex` is the single source (persisted as `tex_source`, user-editable); the
 * `.tex` itself is downloaded client-side, so this endpoint only produces the PDF.
 * User-supplied LaTeX is compiled `--untrusted` (no shell-escape / `\write18`).
 */
export class RenderCvBlocksHandler
    extends ICQRSHandler<RenderCvBlocksCommand, RenderCvBlocksResponseData>
    implements ICommandHandler<RenderCvBlocksCommand, RenderCvBlocksResponseData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly s3UploadService: S3UploadService,
        private readonly s3BuildService: S3BuildService,
    ) {
        super()
    }

    protected override async process(
        command: RenderCvBlocksCommand,
    ): Promise<RenderCvBlocksResponseData> {
        const {
            request: {
                id,
                tex,
            },
            user,
        } = command.params

        if (!user) {
            throw new UserNotFoundException({
            })
        }

        // ownership check -- the row must belong to the caller (mirror
        // updateCvBlocks); missing/foreign rows 404.
        const entity = await this.entityManager.findOne(
            CvBlocksEntity,
            {
                where: {
                    id,
                    user: {
                        id: user.id,
                    },
                },
            },
        )
        if (!entity) {
            throw new CvDocumentNotFoundException({
                cvBlocksId: id,
            })
        }

        const buffer = await this.texToPdf(tex)

        const cdnKey = `cv-blocks/${user.id}/${entity.id}.pdf`
        await this.s3UploadService.buffer({
            name: cdnKey,
            buffer,
            provider: S3Provider.Minio,
            acl: "private",
            contentType: "application/pdf",
        })

        // persist the LaTeX source the PDF was compiled from + the PDF key back
        // onto the row (so a reopen restores the user's edits + the last export).
        entity.texSource = tex
        entity.pdfCdnKey = cdnKey
        await this.entityManager.save(entity)

        const url = await this.s3BuildService.buildSignedGetObjectUrl({
            key: cdnKey,
            provider: S3Provider.Minio,
            expiresInSeconds: Math.floor(envConfig().s3.minio.presignTtl / 1000),
        })

        return {
            url,
            cdnKey,
            format: CvExportFormat.Pdf,
        }
    }

    /**
     * Compiles a `.tex` source into a PDF buffer via `tectonic` in a throwaway
     * temp dir. `--untrusted` blocks shell-escape / `\write18` (the source is
     * USER-EDITABLE). A non-zero exit (LaTeX error / unresolved package) surfaces
     * as {@link CvLatexCompileFailedException} carrying the compile log.
     */
    private async texToPdf(tex: string): Promise<Buffer> {
        const dir = await mkdtemp(join(tmpdir(),
            "cv-tex-"))
        const texPath = join(dir,
            "cv.tex")
        const pdfPath = join(dir,
            "cv.pdf")
        try {
            await writeFile(texPath,
                tex,
                "utf8")
            await execFileAsync(
                "tectonic",
                [
                    "-X",
                    "compile",
                    "--untrusted",
                    "--outdir",
                    dir,
                    texPath,
                ],
                {
                    timeout: TECTONIC_TIMEOUT_MS,
                    maxBuffer: TECTONIC_MAX_BUFFER,
                },
            )
            return await readFile(pdfPath)
        } catch (originalError) {
            throw new CvLatexCompileFailedException({
                originalError,
            })
        } finally {
            await rm(dir,
                {
                    recursive: true,
                    force: true,
                }).catch(() => undefined)
        }
    }
}

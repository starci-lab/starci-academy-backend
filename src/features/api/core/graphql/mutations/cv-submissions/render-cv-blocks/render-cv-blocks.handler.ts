import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    CvBlocksEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    CvDocumentNotFoundException,
    CvDocxBuildFailedException,
    UserNotFoundException,
} from "@modules/exceptions"
import {
    envConfig,
} from "@modules/env"
import {
    S3BuildService,
    S3Provider,
    S3UploadService,
} from "@modules/s3"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import puppeteer from "puppeteer"
import HTMLtoDOCX from "html-to-docx"
import {
    EntityManager,
} from "typeorm"
import {
    RenderCvBlocksCommand,
} from "./render-cv-blocks.command"
import {
    RenderCvBlocksResult,
} from "./graphql-types"
import {
    CvExportFormat,
} from "./cv-export-format.enum"

/**
 * Handler for `renderCvBlocks` — SYNCHRONOUS export of a block-editor CV to PDF
 * or DOCX (HTML-first, single-source). The FE renders the ONE shared CV template
 * and sends its self-contained HTML; this handler is a dumb converter:
 * - PDF  → Puppeteer (`page.setContent` + `page.pdf`, A4).
 * - DOCX → `html-to-docx`.
 * The output is uploaded to MinIO and a fresh presigned GET URL returned;
 * ownership is enforced (the `cv_blocks` row must belong to the caller).
 *
 * No LaTeX/`tectonic` anymore (see `CV-BUILDER-BLOCK-EDITOR-BRAINSTORM.md`,
 * "PIVOT: RENDER = HTML-FIRST") — this yields both PDF and Word from one source
 * and keeps the export byte-consistent with the live HTML preview.
 */
@CommandHandler(RenderCvBlocksCommand)
@Injectable()
export class RenderCvBlocksHandler
    extends ICQRSHandler<RenderCvBlocksCommand, RenderCvBlocksResult>
    implements ICommandHandler<RenderCvBlocksCommand, RenderCvBlocksResult> {
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
    ): Promise<RenderCvBlocksResult> {
        const {
            request: {
                id,
                html,
                format,
            },
            user,
        } = command.params

        if (!user) {
            throw new UserNotFoundException({
            })
        }

        // ownership check — the row must belong to the caller (mirror
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

        const isPdf = format === CvExportFormat.Pdf
        const buffer = isPdf
            ? await this.htmlToPdf(html)
            : await this.htmlToDocx(html)

        const extension = isPdf ? "pdf" : "docx"
        const contentType = isPdf
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        const cdnKey = `cv-blocks/${user.id}/${entity.id}.${extension}`

        await this.s3UploadService.buffer({
            name: cdnKey,
            buffer,
            provider: S3Provider.Minio,
            acl: "private",
            contentType,
        })

        // persist only the PDF key back onto the row (mirrors the old
        // `generated_pdf_cdn_key`); DOCX is a one-off download.
        if (isPdf) {
            entity.pdfCdnKey = cdnKey
            await this.entityManager.save(entity)
        }

        const url = await this.s3BuildService.buildSignedGetObjectUrl({
            key: cdnKey,
            provider: S3Provider.Minio,
            expiresInSeconds: Math.floor(envConfig().s3.minio.presignTtl / 1000),
        })

        return {
            url,
            cdnKey,
            format,
        }
    }

    /**
     * Renders self-contained HTML to a PDF buffer via headless Chromium
     * (Puppeteer, already a project dependency). Same launch args as
     * {@link import("@modules/mixin").NextJsQueryService} for container safety.
     */
    private async htmlToPdf(html: string): Promise<Buffer> {
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
            ],
        })
        try {
            const page = await browser.newPage()
            await page.setContent(html,
                {
                    waitUntil: "networkidle0",
                })
            const pdf = await page.pdf({
                format: "A4",
                printBackground: true,
            })
            return Buffer.from(pdf)
        } finally {
            await browser.close()
        }
    }

    /**
     * Renders self-contained HTML to a .docx buffer via `html-to-docx`.
     */
    private async htmlToDocx(html: string): Promise<Buffer> {
        const result = await HTMLtoDOCX(html,
            null,
            {
                table: {
                    row: {
                        cantSplit: true,
                    },
                },
            })
        if (result instanceof Buffer) {
            return result
        }
        // html-to-docx may resolve an ArrayBuffer depending on the environment
        if (result instanceof ArrayBuffer) {
            return Buffer.from(result)
        }
        throw new CvDocxBuildFailedException({
        })
    }
}

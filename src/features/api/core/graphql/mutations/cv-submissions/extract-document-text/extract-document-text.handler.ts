import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import {
    CvSubmissionExtractEmptyTextException,
    CvSubmissionExtractS3BufferEmptyException,
} from "@modules/exceptions"
import {
    S3Provider,
    S3ReadService,
} from "@modules/s3"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    extractCvText,
} from "@features/api/processors/ai/generate-cv/steps/extract-cv-text"
import {
    ExtractDocumentTextCommand,
} from "./extract-document-text.command"
import {
    ExtractDocumentTextData,
} from "./graphql-types"

/**
 * Handler for `extractDocumentText` — buffers an already-uploaded document
 * (CV or job-description file) from MinIO by its `cdnKey` and extracts its
 * plain text (pdf → pdf-parse, docx → mammoth, else utf-8) via the SHARED
 * {@link extractCvText} util (same machinery the legacy CV-upload scoring
 * path uses). Nothing is persisted — the text is handed straight back to the
 * FE so the user can review/edit it before it feeds `splitCvFromText` /
 * `tailorCvBlocks`. Kind-agnostic: one mutation serves both the "Dán CV có
 * sẵn" and "Chỉnh theo tin tuyển dụng" upload modes.
 *
 * Throws (rather than degrading to "") when the file is missing/empty or no
 * text could be extracted, so the FE can surface a clear error — unlike the
 * async scoring worker, this is a synchronous user-facing call.
 */
@CommandHandler(ExtractDocumentTextCommand)
@Injectable()
export class ExtractDocumentTextHandler
    extends ICQRSHandler<ExtractDocumentTextCommand, ExtractDocumentTextData>
    implements ICommandHandler<ExtractDocumentTextCommand, ExtractDocumentTextData> {
    constructor(
        private readonly s3ReadService: S3ReadService,
    ) {
        super()
    }

    protected override async process(
        command: ExtractDocumentTextCommand,
    ): Promise<ExtractDocumentTextData> {
        const {
            request: {
                cdnKey,
            },
            user,
        } = command.params

        if (!user) {
            throw new UserNotFoundException({
            })
        }

        // buffer the uploaded file from MinIO (same store the presign upload targets)
        const buffer = await this.s3ReadService.buffer({
            key: cdnKey,
            provider: S3Provider.Minio,
        })
        if (!buffer || buffer.length === 0) {
            throw new CvSubmissionExtractS3BufferEmptyException({
                key: cdnKey,
                provider: S3Provider.Minio,
            })
        }

        // extract plain text (pdf → pdf-parse, docx → mammoth, else utf-8)
        const text = await extractCvText({
            buffer,
            key: cdnKey,
        })
        if (text.length === 0) {
            throw new CvSubmissionExtractEmptyTextException({
                key: cdnKey,
            })
        }

        return {
            text,
        }
    }
}

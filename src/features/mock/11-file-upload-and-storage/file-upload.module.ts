import {
    Module,
} from "@nestjs/common"
import {
    MulterMockModule,
} from "./0-multer-single-file-upload/multer.module"
import {
    PresignMockModule,
} from "./1-s3-minio-presigned-urls/presign.module"
import {
    ChunkedMockModule,
} from "./2-chunked-upload-with-progress/chunked.module"
import {
    TusMockModule,
} from "./3-resumable-upload-tus-protocol/tus.module"

@Module({
    imports: [
        MulterMockModule,
        PresignMockModule,
        ChunkedMockModule,
        TusMockModule,
    ],
})
/**
 * Aggregator module for the file-upload sandbox lessons.
 *
 * Unlike the server-state/realtime mocks, these lesson frontends talk to the
 * bare origin (`new URL(VITE_API_BASE).origin`), so every controller is mounted
 * at a top-level path (`/upload`, `/presign/*`, `/uploads/*`, `/files`) and
 * isolation comes from server-generated ids rather than a URL session scope.
 */
export class FileUploadMockModule {}

import {
    Module,
} from "@nestjs/common"
import {
    UploadController,
} from "./upload.controller"
import {
    UploadService,
} from "./upload.service"

/**
 * Feature module cho bai hoc Deduplication va resumable upload.
 * (EN: Feature module for Data Deduplication and Resumable Uploads.)
 */
@Module({
    controllers: [
        UploadController,
    ],
    providers: [
        UploadService,
    ],
    exports: [
        UploadService,
    ],
})
export class UploadModule {}

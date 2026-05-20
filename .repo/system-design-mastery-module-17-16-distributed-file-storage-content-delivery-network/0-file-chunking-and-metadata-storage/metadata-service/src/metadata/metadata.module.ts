import {
    Module,
} from "@nestjs/common"
import {
    MetadataController,
} from "./metadata.controller"
import {
    MetadataService,
} from "./metadata.service"

/**
 * Feature module cho bai hoc Phan doan file va luu tru metadata.
 * (EN: Feature module for File Chunking and Metadata Storage.)
 */
@Module({
    controllers: [
        MetadataController,
    ],
    providers: [
        MetadataService,
    ],
    exports: [
        MetadataService,
    ],
})
export class MetadataModule {}

import {
    Module,
} from "@nestjs/common"
import {
    FileStoreService,
} from "./file-store.service"

/**
 * Shared store module for the file-upload lesson mocks — provides the single
 * in-memory {@link FileStoreService} that the presign, chunked, and tus
 * controllers inject. Exported so per-lesson leaf modules can import it.
 */
@Module({
    providers: [FileStoreService],
    exports: [FileStoreService],
})
export class FileStoreModule {}

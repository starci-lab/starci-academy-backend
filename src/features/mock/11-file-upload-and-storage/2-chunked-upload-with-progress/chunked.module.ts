import {
    Module,
} from "@nestjs/common"
import {
    FileStoreModule,
} from "../../file-store"
import {
    ChunkedController,
} from "./chunked.controller"

/** Leaf module for the chunked-upload-with-progress lesson mock. */
@Module({
    imports: [FileStoreModule],
    controllers: [ChunkedController],
})
export class ChunkedMockModule {}

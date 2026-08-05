import {
    Module,
} from "@nestjs/common"
import {
    FileStoreModule,
} from "../../file-store"
import {
    ChunkedController,
} from "./chunked.controller"

@Module({
    imports: [FileStoreModule],
    controllers: [ChunkedController],
})
/** Leaf module for the chunked-upload-with-progress lesson mock. */
export class ChunkedMockModule {}

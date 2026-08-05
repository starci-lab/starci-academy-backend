import {
    Module,
} from "@nestjs/common"
import {
    FileStoreModule,
} from "../../file-store"
import {
    PresignController,
} from "./presign.controller"

@Module({
    imports: [FileStoreModule],
    controllers: [PresignController],
})
/** Leaf module for the presigned-URL upload lesson mock. */
export class PresignMockModule {}

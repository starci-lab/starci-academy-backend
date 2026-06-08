import {
    Module,
} from "@nestjs/common"
import {
    FileStoreModule,
} from "../../file-store"
import {
    PresignController,
} from "./presign.controller"

/** Leaf module for the presigned-URL upload lesson mock. */
@Module({
    imports: [FileStoreModule],
    controllers: [PresignController],
})
export class PresignMockModule {}

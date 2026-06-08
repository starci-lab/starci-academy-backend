import {
    Module,
} from "@nestjs/common"
import {
    MulterController,
} from "./multer.controller"

/** Leaf module for the single-file multipart upload lesson mock. */
@Module({
    controllers: [MulterController],
})
export class MulterMockModule {}

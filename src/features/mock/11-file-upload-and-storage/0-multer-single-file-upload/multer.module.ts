import {
    Module,
} from "@nestjs/common"
import {
    MulterController,
} from "./multer.controller"

@Module({
    controllers: [MulterController],
})
/** Leaf module for the single-file multipart upload lesson mock. */
export class MulterMockModule {}

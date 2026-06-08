import {
    Module,
} from "@nestjs/common"
import {
    LqipImageController,
} from "./lqip-image.controller"

/** Leaf module for the LQIP / zero-CLS image lesson mock. */
@Module({
    controllers: [LqipImageController],
})
export class LqipImageMockModule {}

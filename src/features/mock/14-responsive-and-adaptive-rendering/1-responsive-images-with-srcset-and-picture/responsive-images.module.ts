import {
    Module,
} from "@nestjs/common"
import {
    ResponsiveImagesController,
} from "./responsive-images.controller"

/** Leaf module for the responsive-images lesson mock. */
@Module({
    controllers: [ResponsiveImagesController],
})
export class ResponsiveImagesMockModule {}

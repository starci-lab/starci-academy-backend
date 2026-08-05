import {
    Module,
} from "@nestjs/common"
import {
    ResponsiveImagesController,
} from "./responsive-images.controller"

@Module({
    controllers: [ResponsiveImagesController],
})
/** Leaf module for the responsive-images lesson mock. */
export class ResponsiveImagesMockModule {}

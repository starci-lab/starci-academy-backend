import {
    Module,
} from "@nestjs/common"
import {
    RingController,
} from "./ring.controller"
import {
    RingService,
} from "./ring.service"

/**
 * Feature module cho bài học Consistent hashing và phân vùng.
 * (EN: Feature module for Consistent Hashing and Partitioning.)
 */
@Module({
    controllers: [
        RingController,
    ],
    providers: [
        RingService,
    ],
    exports: [
        RingService,
    ],
})
export class RingModule {}

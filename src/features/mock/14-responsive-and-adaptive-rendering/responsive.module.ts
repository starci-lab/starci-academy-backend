import {
    Module,
} from "@nestjs/common"
import {
    ResponsiveLayoutMockModule,
} from "./0-responsive-layout-without-media-query-soup"
import {
    ResponsiveImagesMockModule,
} from "./1-responsive-images-with-srcset-and-picture"
import {
    LqipImageMockModule,
} from "./2-zero-cls-image-loading-with-lqip"

@Module({
    imports: [
        ResponsiveLayoutMockModule,
        ResponsiveImagesMockModule,
        LqipImageMockModule,
    ],
})
/**
 * Aggregator module for the responsive-and-adaptive-rendering lessons.
 *
 * Only the first three lessons fetch a product catalog (`GET /api/products`);
 * the adaptive-loading lesson is purely client-side. Lessons 0 and 1 fetch off
 * the full injected `VITE_API_BASE` (session-scoped controllers); lesson 2
 * fetches off its origin (root-mounted controller).
 */
export class ResponsiveMockModule {}

import {
    Controller,
    Get,
    UseInterceptors,
} from "@nestjs/common"
import {
    ApiOperation,
    ApiTags,
} from "@nestjs/swagger"
import {
    MockDelayInterceptor,
} from "../../interceptors/mock-delay.interceptor"
import type {
    ResponsiveLayoutProduct,
} from "./types"

/**
 * Product catalog for the responsive-layout lesson. Mirrors the frontend's
 * static fallback so the rendered grid is identical -- the value the mock adds
 * over the fallback is the artificial loading delay (skeleton state).
 */
const PRODUCTS: ReadonlyArray<ResponsiveLayoutProduct> = [
    {
        id: 1,
        name: "Wireless Headphones",
        description: "Premium noise-cancelling over-ear headphones with 30h battery.",
        price: "$149",
        image: "https://picsum.photos/seed/headphones/400/300",
    },
    {
        id: 2,
        name: "Mechanical Keyboard",
        description: "TKL layout, Cherry MX Red switches, per-key RGB backlight.",
        price: "$89",
        image: "https://picsum.photos/seed/keyboard/400/300",
    },
    {
        id: 3,
        name: "USB-C Hub",
        description: "7-in-1 hub: HDMI 4K, 3× USB-A, SD/MicroSD, 100W PD.",
        price: "$45",
        image: "https://picsum.photos/seed/hub/400/300",
    },
    {
        id: 4,
        name: "Laptop Stand",
        description: "Aluminium riser, adjustable 0–20°, folds flat for travel.",
        price: "$35",
        image: "https://picsum.photos/seed/stand/400/300",
    },
    {
        id: 5,
        name: "Webcam 4K",
        description: "Sony sensor, auto-focus, built-in ring light, privacy shutter.",
        price: "$119",
        image: "https://picsum.photos/seed/webcam/400/300",
    },
    {
        id: 6,
        name: "Desk Lamp",
        description: "LED, 5 colour temperatures, USB-A charging port, touch dimmer.",
        price: "$29",
        image: "https://picsum.photos/seed/lamp/400/300",
    },
]

@ApiTags("mock")
@UseInterceptors(MockDelayInterceptor)
@Controller("mocks/14-responsive-and-adaptive-rendering/0-responsive-layout-without-media-query-soup/sessions/:sessionId")
/**
 * Mock controller for lesson `0-responsive-layout-without-media-query-soup`.
 *
 * Session-scoped path because this lesson's frontend uses the full injected
 * `VITE_API_BASE` (not just its origin) when fetching `/api/products`.
 */
export class ResponsiveLayoutController {
    /**
     * Returns the product catalog rendered by the responsive grid.
     */
    @ApiOperation({
        summary: "List products (responsive layout)",
    })
    @Get("api/products")
    getProducts(): ReadonlyArray<ResponsiveLayoutProduct> {
        return PRODUCTS
    }
}

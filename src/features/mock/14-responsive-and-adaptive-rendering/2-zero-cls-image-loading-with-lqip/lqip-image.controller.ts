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
} from "../../interceptors"
import type {
    LqipProduct,
} from "./types"

/**
 * A minimal valid blurred-JPEG data URI shared by every product as its LQIP.
 * In a real app this would be generated per-image (Blurhash / tiny resize); a
 * single placeholder is fine for the lesson, which only demonstrates that the
 * blur paints instantly with no network request.
 */
const LQIP = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUEA/8QAHhAAAgIDAQEBAAAAAAAAAAAAAQIDBAUREiH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AgsPy7Jw7V9Zs6u5VYxasStGqIojGKSSSS6JJJJJJJJJJJJJJJJJJP/Z"

/** Catalog seeds; image bytes come from picsum at a fixed 800×533 size. */
const SEEDS: ReadonlyArray<{ id: number; name: string; seed: string }> = [
    {
        id: 1, name: "Wireless Headphones", seed: "headphones",
    },
    {
        id: 2, name: "Mechanical Keyboard", seed: "keyboard",
    },
    {
        id: 3, name: "USB-C Hub", seed: "hub",
    },
    {
        id: 4, name: "Laptop Stand", seed: "stand",
    },
    {
        id: 5, name: "Webcam 4K", seed: "webcam",
    },
    {
        id: 6, name: "Desk Lamp", seed: "lamp",
    },
    {
        id: 7, name: "Monitor 27\"", seed: "monitor",
    },
    {
        id: 8, name: "Gaming Mouse", seed: "mouse",
    },
    {
        id: 9, name: "Desk Mat XL", seed: "deskmat",
    },
    {
        id: 10, name: "Microphone", seed: "mic",
    },
    {
        id: 11, name: "Stream Deck", seed: "streamdeck",
    },
    {
        id: 12, name: "Cable Management Box", seed: "cables",
    },
]

/** Pre-built 12-product catalog with fixed dimensions + shared LQIP. */
const PRODUCTS: ReadonlyArray<LqipProduct> = SEEDS.map(({
    id, name, seed,
}) => ({
    id,
    name,
    src: `https://picsum.photos/seed/${seed}/800/533`,
    width: 800,
    height: 533,
    lqip: LQIP,
}))

/**
 * Mock controller for lesson `2-zero-cls-image-loading-with-lqip`.
 *
 * Root-mounted because this lesson's frontend fetches `/api/products` off
 * `new URL(VITE_API_BASE).origin` (the session path is stripped).
 */
@ApiTags("mock")
@UseInterceptors(MockDelayInterceptor)
@Controller()
export class LqipImageController {
    /**
     * Returns the product catalog with fixed dimensions + LQIP placeholders.
     */
    @ApiOperation({
        summary: "List products (LQIP / zero-CLS)",
    })
    @Get("api/products")
    getProducts(): ReadonlyArray<LqipProduct> {
        return PRODUCTS
    }
}

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
    ResponsiveImageCatalogRow,
    ResponsiveImageProduct,
} from "./types"

/** Catalog source rows; the image URLs are derived from the picsum seed. */
const CATALOG: ReadonlyArray<ResponsiveImageCatalogRow> = [
    {
        id: 1, name: "Wireless Headphones", price: "$149", seed: "headphones",
    },
    {
        id: 2, name: "Mechanical Keyboard", price: "$89", seed: "keyboard",
    },
    {
        id: 3, name: "USB-C Hub", price: "$45", seed: "hub",
    },
    {
        id: 4, name: "Laptop Stand", price: "$35", seed: "stand",
    },
    {
        id: 5, name: "Webcam 4K", price: "$119", seed: "webcam",
    },
    {
        id: 6, name: "Desk Lamp", price: "$29", seed: "lamp",
    },
]

/**
 * Builds the nine real, loadable image URLs for one product. picsum serves
 * `.jpg`/`.webp`; the `.avif` source 404s and the browser falls through the
 * `<picture>` list to webp/jpg — while every URL still carries the keyword
 * fragment the lesson spec asserts on.
 */
const buildProduct = (
    {
        id, name, price, seed,
    }: ResponsiveImageCatalogRow,
): ResponsiveImageProduct => ({
    id,
    name,
    price,
    img400: `https://picsum.photos/seed/${seed}/400/300`,
    img800: `https://picsum.photos/seed/${seed}/800/600`,
    img1200: `https://picsum.photos/seed/${seed}/1200/900`,
    wideAvif: `https://picsum.photos/seed/${seed}-wide/1200/500.avif`,
    wideWebp: `https://picsum.photos/seed/${seed}-wide/1200/500.webp`,
    wideJpg: `https://picsum.photos/seed/${seed}-wide/1200/500.jpg`,
    squareAvif: `https://picsum.photos/seed/${seed}-square/600/600.avif`,
    squareWebp: `https://picsum.photos/seed/${seed}-square/600/600.webp`,
    squareJpg: `https://picsum.photos/seed/${seed}-square/600/600.jpg`,
})

/** Pre-built product catalog for the responsive-images lesson. */
const PRODUCTS: ReadonlyArray<ResponsiveImageProduct> = CATALOG.map(buildProduct)

/**
 * Mock controller for lesson `1-responsive-images-with-srcset-and-picture`.
 *
 * Session-scoped path because this lesson's frontend fetches `/api/products`
 * off the full injected `VITE_API_BASE` (not just its origin).
 */
@ApiTags("mock")
@UseInterceptors(MockDelayInterceptor)
@Controller("mocks/14-responsive-and-adaptive-rendering/1-responsive-images-with-srcset-and-picture/sessions/:sessionId")
export class ResponsiveImagesController {
    /**
     * Returns the product catalog with multi-resolution / art-direction URLs.
     */
    @ApiOperation({
        summary: "List products (responsive images)",
    })
    @Get("api/products")
    getProducts(): ReadonlyArray<ResponsiveImageProduct> {
        return PRODUCTS
    }
}

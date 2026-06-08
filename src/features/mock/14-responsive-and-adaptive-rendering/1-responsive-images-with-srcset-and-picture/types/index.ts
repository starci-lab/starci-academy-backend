/**
 * Product shape returned by `GET /api/products` for the responsive-images
 * lesson. The URL fragments ("400"/"800"/"1200"/"wide"/"square"/".avif"/
 * ".webp") matter: the lesson's spec asserts on `currentSrc` substrings.
 */
export interface ResponsiveImageProduct {
    /** Stable id. */
    id: number
    /** Product name. */
    name: string
    /** Display price string. */
    price: string
    /** 400w candidate URL. */
    img400: string
    /** 800w candidate URL. */
    img800: string
    /** 1200w candidate URL. */
    img1200: string
    /** Wide-crop AVIF source. */
    wideAvif: string
    /** Wide-crop WebP source. */
    wideWebp: string
    /** Wide-crop JPG fallback. */
    wideJpg: string
    /** Square-crop AVIF source. */
    squareAvif: string
    /** Square-crop WebP source. */
    squareWebp: string
    /** Square-crop JPG fallback. */
    squareJpg: string
}

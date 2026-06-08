/** Product shape returned by `GET /api/products` for the LQIP/zero-CLS lesson. */
export interface LqipProduct {
    /** Stable id. */
    id: number
    /** Product name. */
    name: string
    /** Full-resolution image URL. */
    src: string
    /** Native image width in px (used to reserve aspect-ratio → zero CLS). */
    width: number
    /** Native image height in px. */
    height: number
    /** Tiny base64 blurred placeholder, rendered with no network request. */
    lqip: string
}

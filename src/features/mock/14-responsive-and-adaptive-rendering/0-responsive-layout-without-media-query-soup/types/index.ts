/** Product shape returned by `GET /api/products` for the responsive-layout lesson. */
export interface ResponsiveLayoutProduct {
    /** Stable id. */
    id: number
    /** Product name. */
    name: string
    /** Short marketing description (shown only in the rich/wide layout). */
    description: string
    /** Display price string. */
    price: string
    /** Thumbnail image URL. */
    image: string
}

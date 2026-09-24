import {
    AbstractException,
} from "../abstract"
import type {
    AbstractExceptionMetadata,
} from "../abstract"

/** Identifies which retired SKU the caller tried to buy. */
export interface LegacyProductSaleClosedExceptionMetadata extends AbstractExceptionMetadata {
    product: string
}

/** Rejects creation of a new legacy checkout after the Pro cutover. */
export class LegacyProductSaleClosedException extends AbstractException {
    constructor({
        product,
        originalError,
    }: LegacyProductSaleClosedExceptionMetadata) {
        super(
            "This legacy product is no longer available for new purchases; use StarCi Pro",
            "LEGACY_PRODUCT_SALE_CLOSED_EXCEPTION",
            {
                product,
                originalError,
            },
        )
    }
}

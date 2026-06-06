/** A single invoice line item (dynamic-fields lesson). */
export interface MockInvoiceItem {
    /** Free-text description of the line item. */
    description: string
    /** Quantity ordered (positive integer). */
    quantity: number
    /** Unit price (non-negative). */
    unitPrice: number
}

/** A mock invoice persisted in a lesson session. */
export interface MockInvoice {
    /** Unique numeric id of the invoice within its session. */
    id: number
    /** Customer name the invoice is addressed to. */
    customer: string
    /** Computed total = sum of quantity * unitPrice across items. */
    total: number
}

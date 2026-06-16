/**
 * A single option from the ES completion-suggester response used to build a
 * foundation category typeahead suggestion (text = label, _id = category id).
 */
export interface CategorySuggestionOption {
    /** The suggest text (already the clean category label to display). */
    text: string
    /** The matched category document id (`_source: false`, so only `_id` returns). */
    _id?: string
}

import {
    Locale,
} from "@modules/databases"
/** Params for reading the same markdown heading in EN and VI documents. */
export interface ExtractParams {
    /** Heading text without hashes, e.g. `"Title"`. */
    key: string
    markdownMap: Map<Locale, string>
}

/** English and Vietnamese bodies for one extracted section. */
export type ExtractResult = Map<Locale, string>

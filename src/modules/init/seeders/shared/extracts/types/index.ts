/** Result of cutting a delimiter-bounded leaf out of a markdown section body. */
export interface DelimiterCut {
    /** The trimmed section content (delimiter lines removed when bounded). */
    content: string
    /** Whether the content was wrapped by delimiter lines (a string leaf). */
    bounded: boolean
}

/** One markdown heading slice: the heading key and its raw section body. */
export interface HeadingSlice {
    /** The heading text used as the object key for this slice. */
    key: string
    /** The raw markdown body between this heading and the next sibling. */
    body: string
}

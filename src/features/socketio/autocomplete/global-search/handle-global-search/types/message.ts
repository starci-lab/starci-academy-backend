/** Single search result item for a group (course/module/content/etc.). */
export interface GlobalSearchItem {
    /** Entity id */
    id: string
    /** Human-facing display id */
    displayId: string
    /** Title for display (non-highlighted). */
    title: string
    /** Highlighted snippets that matched (title/description/etc.) */
    texts: Array<string>
}

/** Content of a global search message. */
export interface GlobalSearchSocketIoMessage {
    /** Matched courses */
    courses: Array<GlobalSearchItem>
    /** Matched modules */
    modules: Array<GlobalSearchItem>
    /** Matched challenges */
    challenges: Array<GlobalSearchItem>
    /** Matched lesson videos */
    lessonVideos: Array<GlobalSearchItem>
    /** Matched contents (full-text with snippets) */
    contents: Array<GlobalSearchItem>
}


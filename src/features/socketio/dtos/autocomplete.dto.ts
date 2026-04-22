export enum AutocompleteEntity {
    Course = "course",
    LessonVideo = "lessonVideo",
    Challenge = "challenge",
    Content = "content",
}

export interface AutocompleteRequest {
    /** Search term the user is typing. */
    query: string
    /** Entities to search in. Defaults to all. */
    entities?: Array<AutocompleteEntity>
    /** Max suggestions per entity. Defaults to 5. */
    size?: number
}

export interface AutocompleteSuggestion {
    id: string
    entity: AutocompleteEntity
    title: string
    highlight?: string
    score: number
}

export interface AutocompleteResponse {
    query: string
    suggestions: Array<AutocompleteSuggestion>
}

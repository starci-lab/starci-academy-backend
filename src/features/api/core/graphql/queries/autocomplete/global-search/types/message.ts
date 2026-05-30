export interface GlobalSearchItem {
    id: string
    displayId: string
    title: string
    texts: Array<string>
}

export interface GlobalSearchMessage {
    courses: Array<GlobalSearchItem>
    modules: Array<GlobalSearchItem>
    challenges: Array<GlobalSearchItem>
    contents: Array<GlobalSearchItem>
}

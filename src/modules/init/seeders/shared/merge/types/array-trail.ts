/** One ancestor-array hop: the path prefix we entered + the `orderIndex` of the entry we picked. */
export interface ArrayTrailEntry {
    /** Dot-path of the array we entered (e.g. `"requirements"`). */
    key: string
    /** The entry's `orderIndex` used to align the same entry across locales. */
    orderIndex: unknown
}

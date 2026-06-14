/** A saved S3 target (secret omitted by the API listing). */
export interface Target {
    id: string
    name: string
    endpoint: string
    region: string
    bucket: string
}

/** A registered local artifact row. */
export interface Artifact {
    id: string
    type: string
    label: string | null
    localPath: string
    keyPrefix: string | null
    targetIds: Array<string>
    status: string
    bytes: number | null
    createdAt: number
    syncedAt: number | null
}

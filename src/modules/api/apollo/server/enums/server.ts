/** Apollo server deployment type. */
export enum ApolloServerType {
    /** Single autoSchemaFile server — production path; hosts formatError + HTTP status plugin. */
    Monolithic = "monolithic",
    /** Federation subgraph mode — stub until wired; selecting it serves no schema today. */
    Federation = "federation",
}

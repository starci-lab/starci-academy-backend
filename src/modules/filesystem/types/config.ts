/** payOS credentials stored in mounted {@link AppConfig} (see `.mount/config/app.json`). */
export interface AppConfigPayos {
    clientId: string
    checksumKey: string
}

/** Root app config. */
export interface AppConfig {
    sentryDsn: string
    /** Optional; when set, overrides {@link envConfig}.payos for client id and checksum key. */
    payos?: AppConfigPayos
}

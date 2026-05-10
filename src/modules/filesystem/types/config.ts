/** payOS credentials stored in mounted {@link AppConfig} (see `.mount/config/app.json`). */
export interface AppConfigPayos {
    clientId: string
    checksumKey: string
}

/** `systemConfig.challenge` in mounted `app.json`. */
export interface AppConfigSystemChallenge {
    passThreshold: number
}

/** `systemConfig.task` in mounted `app.json`. */
export interface AppConfigSystemTask {
    passThreshold: number
}

/** `systemConfig` in mounted `app.json`. */
export interface AppConfigSystemConfig {
    challenge: AppConfigSystemChallenge
    task: AppConfigSystemTask
}

/** Root app config. */
export interface AppConfig {
    sentryDsn: string
    /** Optional; when set, overrides {@link envConfig}.payos for client id and checksum key. */
    payos: AppConfigPayos
    /** Optional public/system tuning (see `.mount/config/app.json`). */
    systemConfig: AppConfigSystemConfig
}
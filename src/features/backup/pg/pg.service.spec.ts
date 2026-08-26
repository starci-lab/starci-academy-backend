jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: jest.fn(),
    }))
jest.mock("@modules/integrations/execa/execa.service",
    () => ({
        ExecaService: class ExecaService {},
    }))

import {
    envConfig
} from "@modules/platform/env/config"
import {
    BackupEncryptionPasswordNotSetException
} from "@modules/platform/exceptions/errors/backup/backup-encryption-password-not-set"
import {
    PgBackupService
} from "./pg.service"

describe("PgBackupService",
    () => {
        it("does nothing outside production",
            async () => {
                jest.mocked(envConfig).mockReturnValue({
                    isProduction: false
                } as never)
                const exec = jest.fn()
                const service = new PgBackupService({
                    stream: jest.fn()
                } as never,
{
    exec
} as never,
{
    log: jest.fn()
} as never)

                await expect(service.backup({
                    postgresUrl: "postgres://db",
                    s3KeyPrefix: "backups",
                    artifactBaseName: "nightly",
                })).resolves.toBeUndefined()
                expect(exec).not.toHaveBeenCalled()
            })

        it("rejects production backups without an encryption password",
            async () => {
                jest.mocked(envConfig).mockReturnValue({
                    isProduction: true,
                    backup: {
                        encrypt: {
                            password: ""
                        }
                    },
                } as never)
                const service = new PgBackupService({
                    stream: jest.fn()
                } as never,
{
    exec: jest.fn()
} as never,
{
    log: jest.fn()
} as never)

                await expect(service.backup({
                    postgresUrl: "postgres://db",
                    s3KeyPrefix: "backups",
                    artifactBaseName: "nightly",
                })).rejects.toBeInstanceOf(BackupEncryptionPasswordNotSetException)
            })
    })

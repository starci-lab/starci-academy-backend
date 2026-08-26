import {
    createDigitalOceanS3Provider, createMinioProvider, createMinioPresignProvider
} from "./s3.providers"
import {
    S3Client
} from "@aws-sdk/client-s3"

describe("S3 providers",
    () => {
        it("creates configured AWS clients for each provider",
            () => {
                for (const factory of [createDigitalOceanS3Provider,
                    createMinioProvider,
                    createMinioPresignProvider]) {
                    const provider = factory()
                    expect("useFactory" in provider).toBe(true)
                    if ("useFactory" in provider && typeof provider.useFactory === "function") {
                        expect(provider.useFactory()).toBeInstanceOf(S3Client)
                    }
                }
            })
    })

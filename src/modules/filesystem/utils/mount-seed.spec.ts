import {
    clearRuntimeContextRoot, getRuntimeContextRoot, getSeedConfig, setRuntimeContextRoot, setRuntimeSeedConfig, clearRuntimeSeedConfig
} from "./mount-seed"

describe("mount-seed runtime overrides",
    () => {
        it("prefers explicit and runtime seed config and clears context root",
            () => {
                const config = {
                    seeders: {
                        enabled: true
                    }
                } as never
                setRuntimeSeedConfig(config)
                expect(getSeedConfig()).toBe(config)
                expect(getSeedConfig({
                    seeders: {
                        enabled: false
                    }
                } as never).seeders.enabled).toBe(false)
                setRuntimeContextRoot("/tmp/root")
                expect(getRuntimeContextRoot()).toBe("/tmp/root")
                clearRuntimeContextRoot()
                clearRuntimeSeedConfig()
                expect(getRuntimeContextRoot()).toBeUndefined()
            })
        it("returns the fully disabled config after runtime overrides are cleared",
            () => {
                clearRuntimeSeedConfig()
                const config = getSeedConfig()
                expect(config.seeders.enabled).toBe(false)
                expect(config.synchronizers.enabled).toBe(false)
                expect(config.seeders.courses.flashcard.enabled).toBe(false)
            })
    })

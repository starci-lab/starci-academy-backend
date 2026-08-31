import {
    envConfig,
} from "./config"

describe("local authentication defaults",
    () => {
        const originalKeycloakUrl = process.env.KEYCLOAK_URL

        beforeEach(() => {
            delete process.env.KEYCLOAK_URL
        })

        afterAll(() => {
            if (originalKeycloakUrl === undefined) {
                delete process.env.KEYCLOAK_URL
                return
            }
            process.env.KEYCLOAK_URL = originalKeycloakUrl
        })

        it("uses the canonical localhost Keycloak origin",
            () => {
                expect(envConfig().keycloak.url).toBe("http://localhost:8080")
            })
    })

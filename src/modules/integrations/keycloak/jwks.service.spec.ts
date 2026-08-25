jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: () => ({
            keycloak: {
                url: "https://keycloak.test", realm: "realm" 
            } 
        }) 
    }))
jest.mock("jwks-rsa",
    () => jest.fn(() => ({
        getSigningKey: jest.fn() 
    })))
jest.mock("jsonwebtoken",
    () => ({
        verify: jest.fn((_token: string, _key: unknown, _opts: unknown, cb: (error: Error | null, payload?: object) => void) => cb(null,
            {
                preferred_username: "user" 
            })) 
    }))
import {
    KeycloakJwksService 
} from "./jwks.service"

describe("KeycloakJwksService",
    () => {
        it("returns inactive when a valid payload has no subject",
            async () => { await expect(new KeycloakJwksService().verifyAccessToken("token")).resolves.toEqual({
                active: false 
            }) })
    })

import {
    Injectable 
} from "@nestjs/common"
import {
    AxiosService 
} from "@modules/axios"
import type {
    AxiosInstance 
} from "axios"
import {
    envConfig 
} from "@modules/env"
import type {
    KeycloakUser,
} from "./types"
import {
    MountStorageService,
} from "@modules/filesystem"

@Injectable()
/**
 * Service for interacting with Keycloak users
 */
export class KeycloakUserService {
    private readonly axiosInstance: AxiosInstance
    private readonly baseUrl = envConfig().keycloak.url.replace(/\/$/,
        "")
    /**
     * Constructor.
     * @param axiosService - The Axios service.
     * @param mountStorageService - The mount storage service.
     */
    constructor(
        private readonly axiosService: AxiosService,
        private readonly mountStorageService: MountStorageService,
    ) {
        this.axiosInstance = this.axiosService.create({
            key: "keycloak",
            config: {
                baseURL: this.baseUrl,
            },
        })
    }

    /**
     * Get user by username from Keycloak
     */
    async getUserByUsername(
        username: string
    ): Promise<KeycloakUser | null> {
        const adminToken = await this.getAdminToken()
        const realm = envConfig().keycloak.realm
        const response = await this.axiosInstance.get<Array<KeycloakUser>>(
            `/admin/realms/${realm}/users`,
            {
                params: {
                    username,
                },
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                },
            }
        )
        const users = response.data
        if (!users || users.length === 0) {
            return null
        }
        return users[0]
    }

    /**
     * Get user by user ID from Keycloak
     */
    async getUserById(userId: string): Promise<KeycloakUser> {
        const adminToken = await this.getAdminToken()
        const response = await this.axiosInstance.get<KeycloakUser>(
            `/admin/realms/${envConfig().keycloak.realm}/users/${userId}`,
            {
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                },
            },
        )
        return response.data
    }

    /**
     * Get admin token from Keycloak
     */
    async getAdminToken(): Promise<string> {
        const response = await this.axiosInstance.post(
            `/realms/${envConfig().keycloak.realm}/protocol/openid-connect/token`,
            new URLSearchParams({
                grant_type: "password",
                client_id: envConfig().keycloak.admin.clientId,
                username: this.mountStorageService.keycloakAdmin.username,
                password: this.mountStorageService.keycloakAdmin.password,
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        )
    
        return response.data.access_token
    }

    /**
     * Reset password for a Keycloak user.
     */
    async resetUserPassword(userId: string, password: string): Promise<void> {
        const adminToken = await this.getAdminToken()
        await this.axiosInstance.put(
            `/admin/realms/${envConfig().keycloak.realm}/users/${userId}/reset-password`,
            {
                type: "password",
                value: password,
                temporary: false,
            },
            {
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                },
            },
        )
    }

    /**
     * Marks a user's email as verified (Admin API). Drops VERIFY_EMAIL from required actions when present.
     */
    async setUserEmailVerified(userId: string): Promise<void> {
        const adminToken = await this.getAdminToken()
        const user = await this.getUserById(userId)
        const previousActions = user.requiredActions
        const requiredActions = Array.isArray(previousActions)
            ? (previousActions as string[]).filter(
                (action) => action !== "VERIFY_EMAIL"
            )
            : []
        await this.axiosInstance.put(
            `/admin/realms/${envConfig().keycloak.realm}/users/${userId}`,
            {
                ...user,
                emailVerified: true,
                requiredActions,
            },
            {
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                },
            },
        )
    }
}
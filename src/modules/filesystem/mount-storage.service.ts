import {
    Injectable, OnModuleInit 
} from "@nestjs/common"
import {
    AppConfig,
    SecretKeycloakAdmin,
} from "./types"
import {
    MountFilesystemService
} from "./mount.service"
import {
    ReadinessWatcherFactoryService 
} from "@modules/mixin"

@Injectable()
export class MountStorageService implements OnModuleInit {
    public githubAccessToken: string
    public appConfig: AppConfig 
    public s3SecretAccessKey: string
    public keycloakClientSecret: string
    public payosApiKey: string
    public geminiApiKey: string
    public openAiApiKey: string
    public sepayApiKey: string
    public brevoSmtpPassword: string
    public keycloakAdmin: SecretKeycloakAdmin
    constructor(
        private readonly mountFilesystemService: MountFilesystemService,
        private readonly readinessWatcherFactoryService: ReadinessWatcherFactoryService,
    ) {}

    onModuleInit() {   
        this.readinessWatcherFactoryService.createWatcher(MountStorageService.name)
        // get github access token from mount filesystem service
        this.githubAccessToken = this.mountFilesystemService.githubAccessToken()
        // get app config from mount filesystem service
        this.appConfig = this.mountFilesystemService.appConfig()
        // get s3 secret access key from mount filesystem service
        this.s3SecretAccessKey = this.mountFilesystemService.s3SecretAccessKey()
        // get keycloak client secret from mount filesystem service
        this.keycloakClientSecret = this.mountFilesystemService.keycloakClientSecret()
        // get payos api key from mount filesystem service
        this.payosApiKey = this.mountFilesystemService.payosApiKey()
        // get gemini api key from mount filesystem service
        this.geminiApiKey = this.mountFilesystemService.geminiApiKey()
        // get openai api key from mount filesystem service
        this.openAiApiKey = this.mountFilesystemService.openAiApiKey()
        // get sepay api key from mount filesystem service
        this.sepayApiKey = this.mountFilesystemService.sepayApiKey()
        // get brevo smtp password from mount filesystem service
        this.brevoSmtpPassword = this.mountFilesystemService.brevoSmtpPassword()
        // get keycloak admin credentials from mount filesystem service
        this.keycloakAdmin = this.mountFilesystemService.keycloakAdmin()
        // set readiness watcher to true
        this.readinessWatcherFactoryService.setReady(MountStorageService.name)
    }
}
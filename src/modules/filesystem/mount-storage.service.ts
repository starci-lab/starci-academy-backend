import {
    Injectable, OnModuleInit
} from "@nestjs/common"
import {
    AppConfig,
} from "./types/config"
import {
    SecretKeycloakAdmin,
} from "./types/secrets"
import {
    MountFilesystemService
} from "./mount.service"
import {
    setRuntimeAppConfig,
} from "./utils/mount-secrets"
import {
    ReadinessWatcherFactoryService,
} from "@modules/lib/mixin/readiness-watcher-factory.service"

@Injectable()
/**
 * Eager snapshot of mount secrets into fields plus a readiness watcher so
 * other modules do not race the first request against unread key files.
 */
export class MountStorageService implements OnModuleInit {
    public githubAccessToken: string
    public githubSecretKey: string
    public appConfig: AppConfig
    public s3SecretAccessKey: string
    public encryptionKey: string
    public keycloakClientSecret: string
    public payosApiKey: string
    public sepayApiKey: string
    public stripeSecretKey: string
    public stripeWebhookSecret: string
    public paypalClientId: string
    public paypalClientSecret: string
    public paypalWebhookId: string
    public nowpaymentsApiKey: string
    public nowpaymentsIpnSecret: string
    public brevoSmtpPassword: string
    public keycloakAdmin: SecretKeycloakAdmin
    public adminApiKey: string
    constructor(
        private readonly mountFilesystemService: MountFilesystemService,
        private readonly readinessWatcherFactoryService: ReadinessWatcherFactoryService,
    ) { }

    onModuleInit() {
        this.readinessWatcherFactoryService.createWatcher(MountStorageService.name)
        // get github access token from mount filesystem service
        this.githubAccessToken = this.mountFilesystemService.githubAccessToken()
        // get github secret key from mount filesystem service
        this.githubSecretKey = this.mountFilesystemService.githubSecretKey()
        // get app config from mount filesystem service
        this.appConfig = this.mountFilesystemService.appConfig()
        // get s3 secret access key from mount filesystem service
        this.s3SecretAccessKey = this.mountFilesystemService.s3SecretAccessKey()
        // get AES encryption key from mount filesystem service
        this.encryptionKey = this.mountFilesystemService.encryptionKey()
        // get keycloak client secret from mount filesystem service
        this.keycloakClientSecret = this.mountFilesystemService.keycloakClientSecret()
        // get payos api key from mount filesystem service
        this.payosApiKey = this.mountFilesystemService.payosApiKey()
        // get sepay api key from mount filesystem service
        this.sepayApiKey = this.mountFilesystemService.sepayApiKey()
        // get stripe secret api key from mount filesystem service
        this.stripeSecretKey = this.mountFilesystemService.stripeSecretKey()
        // get stripe webhook signing secret from mount filesystem service
        this.stripeWebhookSecret = this.mountFilesystemService.stripeWebhookSecret()
        // get paypal client id from mount filesystem service
        this.paypalClientId = this.mountFilesystemService.paypalClientId()
        // get paypal client secret from mount filesystem service
        this.paypalClientSecret = this.mountFilesystemService.paypalClientSecret()
        // get paypal webhook id from mount filesystem service
        this.paypalWebhookId = this.mountFilesystemService.paypalWebhookId()
        // get nowpayments api key from mount filesystem service
        this.nowpaymentsApiKey = this.mountFilesystemService.nowpaymentsApiKey()
        // get nowpayments ipn secret from mount filesystem service
        this.nowpaymentsIpnSecret = this.mountFilesystemService.nowpaymentsIpnSecret()
        // get brevo smtp password from mount filesystem service
        this.brevoSmtpPassword = this.mountFilesystemService.brevoSmtpPassword()
        // get keycloak admin credentials from mount filesystem service
        this.keycloakAdmin = this.mountFilesystemService.keycloakAdmin()
        // get admin api key from mount filesystem service
        this.adminApiKey = this.mountFilesystemService.adminApiKey()
        // set readiness watcher to true
        this.readinessWatcherFactoryService.setReady(MountStorageService.name)
    }

    /**
     * Apply a merged app catalog (mount data + `app.yaml`) after init seeding.
     */
    applyAppConfig(appConfig: AppConfig): void {
        setRuntimeAppConfig(appConfig)
        this.appConfig = appConfig
    }
}
import {
    Module,
} from "@nestjs/common"
import {
    JwtModule,
} from "@nestjs/jwt"
import {
    JWT_EXPIRES_IN,
    JWT_SECRET,
} from "./constants/jwt"
import {
    AuthController,
} from "./auth.controller"
import {
    AuthStoreService,
} from "./auth-store.service"
import {
    SocketioSecurityJwtGateway,
} from "./socketio-security-jwt.gateway"

@Module({
    imports: [
        JwtModule.register({
            secret: JWT_SECRET,
            signOptions: {
                expiresIn: JWT_EXPIRES_IN 
            },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthStoreService,
        SocketioSecurityJwtGateway],
})
/**
 * Lesson module for `1-socketio-security-jwt`.
 *
 * Wires the JWT signer/verifier shared by the REST auth controller (issues
 * tokens) and the Socket.IO gateway (validates them at handshake).
 */
export class SocketioSecurityJwtMockModule {}

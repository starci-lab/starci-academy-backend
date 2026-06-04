/**
 * Bootstrap gRPC Product Microservice — listens on port 5002.
 */
import {
    NestFactory,
} from "@nestjs/core"
import {
    MicroserviceOptions,
    Transport,
} from "@nestjs/microservices"
import {
    join,
} from "path"
import {
    AppModule,
} from "./app.module"

/**
 * Logic — Start Nest app with global ValidationPipe and Docker-friendly bind.
 * Code — `NestFactory.create` → `useGlobalPipes(ValidationPipe)` → `app.listen(port, '0.0.0.0')`.
 */
export async function bootstrap(): Promise<void> {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
        transport: Transport.GRPC,
        options: {
// Package matches `package product;` in `product.proto`.
            package: "product",
            protoPath: join(__dirname, "../proto/product.proto"),
// Listen on all interfaces so Docker port mapping works.
            url: "0.0.0.0:5002",
        },
    })
    await app.listen()
}

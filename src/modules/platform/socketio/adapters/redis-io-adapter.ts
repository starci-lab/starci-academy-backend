import {
    createAdapter 
} from "@socket.io/redis-adapter"

import {
    ServerOptions 
} from "http"
import {
    RedisClient,
} from "@modules/lib/native/redis/types/client"
import {
    IoAdapter 
} from "@nestjs/platform-socket.io"

/**
 * Shares Socket.IO rooms across pods via Redis pub/sub -- without it, room emits stay local
 * to one instance.
 */
export class RedisIoAdapter extends IoAdapter {
    private adapterConstructor: ReturnType<typeof createAdapter>
    private redisClient: RedisClient

    public setClient(redisClient: RedisClient) {
        this.redisClient = redisClient
    }

    public async connect(): Promise<void> {
        const pubClient = this.redisClient.duplicate()
        const subClient = this.redisClient.duplicate()
        await Promise.all(
            [
                pubClient.connect(),
                subClient.connect(),
            ]
        )
        this.adapterConstructor = createAdapter(
            pubClient,
            subClient
        )
    }

    public createIOServer(
        port: number, 
        options?: ServerOptions
    ) {
        const server = super.createIOServer(port,
            options)
        server.adapter(this.adapterConstructor)
        return server
    }
}
/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
    const consul = this.configService.getOrThrow<ConsulConfig>("consul")
        this.baseUrl = consul.baseUrl
    }

    /**
     * Proxy health check listing instances for a Consul service.
     */
    @Get("health/:service")
    async health(@Param("service") service: string): Promise<unknown> {
        const response = await axios.get(`${this.baseUrl}/v1/health/service/${service}`)
        return response.data
    }

    /**
     * Register service into Consul catalog via Agent HTTP API.
     */
    @Post("register")
    async register(@Body() body: { id: string; name: string; address: string; port: number }): Promise<{ status: string }> {
        await axios.put(`${this.baseUrl}/v1/agent/service/register`,
            {
                ID: body.id,
                Name: body.name,
                Address: body.address,
                Port: body.port,
            })
        return {
            status: "registered" 
        }
    }

    /**
     * Deregister service from Agent by ID (matches registration ID).
     */
    @Post("deregister/:id")
    async deregister(@Param("id") id: string): Promise<{ status: string }> {
        await axios.put(`${this.baseUrl}/v1/agent/service/deregister/${id}`)
        return {
            status: "deregistered" 
        }
    }
}

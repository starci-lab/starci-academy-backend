/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    @Post()
    create(@Body() dto: CreateUserDto: ReturnType<UsersService["create"]> {
        return this.usersService.create(dto)
    }

    @Get(":id")
    async findOne(@Param("id", ParseIntPipe) id: number) {
        const user = await this.usersService.findOne(id)
        if (!user) {
            throw new NotFoundException(`User ${id} not found`)
        }
        return user
    }
}

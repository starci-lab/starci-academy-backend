/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * Liệt kê mèo trong PostgreSQL (GET `/cats`).
     * (EN: List cats from PostgreSQL (GET `/cats`).)
     */
    @Get()/**
 * Logic — Đọc/truy vấn dữ liệu qua `findAll`.
 * Code — Truy vấn in-memory / DB / cache và map response DTO.
 * (EN Logic: Read/query via `findAll`.)
 * (EN Code: Query in-memory / DB / cache and map response.)
 */
    findAll(): Promise<CatEntity[]> {
        return this.catsService.findAll()
    }

    /**
     * Tạo mèo từ body (POST `/cats`) — lưu DB.
     * (EN: Create cat from body (POST `/cats`) — persisted.)
     */
    @Post()
    create(@Body() body: CreateCatDto): Promise<CatEntity> {
        return this.catsService.create(body)
    }
}

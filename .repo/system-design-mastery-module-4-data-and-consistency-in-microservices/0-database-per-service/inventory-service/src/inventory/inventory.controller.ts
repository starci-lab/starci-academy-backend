/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * Logic — tạo sản phẩm mới với số lượng tồn kho ban đầu.
     * Code — `@Post()` → `this.inventory.create(name, stock)`.
     * (EN Logic: Creates a new product with initial stock quantity.)
     * (EN Code: `@Post()` → `this.inventory.create(name, stock)`.)
     */
    @Post()
    async create(@Body() body: { name: string; stock: number }: Promise<ReturnType<InventoryService["create"]>> {
        return this.inventory.create(body.name, body.stock)
    }

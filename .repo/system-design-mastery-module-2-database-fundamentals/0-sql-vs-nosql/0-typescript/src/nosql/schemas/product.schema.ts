/**
 * Mongoose schema — `products` collection in MongoDB.
 */
import {
    Prop,
    Schema,
    SchemaFactory,
} from "@nestjs/mongoose"
import {
    HydratedDocument,
} from "mongoose"

/**
 * Hydrated MongoDB document type (with Mongoose methods).
 */
export type ProductDocument = HydratedDocument<Product>

/**
 * Logic: Define schema for `products` collection with fields: name, price, category, metadata, createdAt.
 * Code: `@Schema` decorator with `timestamps`, `@Prop` for each field.
 */
@Schema({ timestamps: { createdAt: "createdAt", updatedAt: false } })
export class Product {
        // Product name, required.
    @Prop({ required: true })
        name: string

        // Product price, required.
    @Prop({ required: true })
        price: number

        // Product category, required.
    @Prop({ required: true })
        category: string

        // Extended metadata as object, default null.
    @Prop({ type: Object, default: null })
        metadata: Record<string, unknown> | null

        // Creation timestamp, auto-set by Mongoose timestamps.
    @Prop()
        createdAt: Date
}

/**
 * Schema factory — create Mongoose schema from Product class.
 */
export const ProductSchema = SchemaFactory.createForClass(Product)

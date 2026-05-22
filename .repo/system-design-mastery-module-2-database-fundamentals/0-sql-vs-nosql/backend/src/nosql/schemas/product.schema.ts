/**
 * Mongoose schema — collection `products` trong MongoDB.
 * (EN: Mongoose schema — `products` collection in MongoDB.)
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
 * Kieu document MongoDB da hydrate (co cac method Mongoose).
 * (EN: Hydrated MongoDB document type (with Mongoose methods).)
 */
export type ProductDocument = HydratedDocument<Product>

/**
 * Logic — Dinh nghia schema cho collection `products` voi cac truong: name, price, category, metadata, createdAt.
 * Code — Decorator `@Schema` voi `timestamps`, `@Prop` cho tung truong.
 * (EN Logic: Define schema for `products` collection with fields: name, price, category, metadata, createdAt.)
 * (EN Code: `@Schema` decorator with `timestamps`, `@Prop` for each field.)
 */
@Schema({ timestamps: { createdAt: "createdAt", updatedAt: false } })
export class Product {
    // Ten san pham, bat buoc.
    // (EN: Product name, required.)
    @Prop({ required: true })
        name: string

    // Gia san pham, bat buoc.
    // (EN: Product price, required.)
    @Prop({ required: true })
        price: number

    // Phan loai san pham, bat buoc.
    // (EN: Product category, required.)
    @Prop({ required: true })
        category: string

    // Du lieu mo rong dang object, mac dinh null.
    // (EN: Extended metadata as object, default null.)
    @Prop({ type: Object, default: null })
        metadata: Record<string, unknown> | null

    // Thoi gian tao, tu dong gan boi Mongoose timestamps.
    // (EN: Creation timestamp, auto-set by Mongoose timestamps.)
    @Prop()
        createdAt: Date
}

/**
 * Schema factory — tao Mongoose schema tu class Product.
 * (EN: Schema factory — create Mongoose schema from Product class.)
 */
export const ProductSchema = SchemaFactory.createForClass(Product)

import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    brand: { type: String, required: true },
    category: {
      type: String,
      required: true,
     
    },
    sku: { type: String, unique: true, sparse: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    discountPercent: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    images: { type: [String], default: [] },
    specifications: { type: Map, of: String, default: {} },
    goodSides: { type: [String], default: [] },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0 },
    warranty: { type: String, default: "1 Year Manufacturer Warranty" },
    releaseYear: { type: Number },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);
//
export default mongoose.model("Product", productSchema);

import Product from "../models/Product.js";
import { upload }from "../services/ai-service.js";

// ============================================
// GET ALL PRODUCTS
// ============================================
export const getProducts = async (req, res) => {
    try {
        const {
            category,
            brand,
            search,
            minPrice,
            maxPrice,
            sort = "newest",
            page = 1,
            limit = 20,
            featured,
        } = req.query;

        const filter = {};

        // Category filter
        if (category) {
            filter.category = category;
        }

        // Brand filter
        if (brand) {
            filter.brand = new RegExp(`^${brand}$`, "i");
        }

        // Featured products
        if (featured === "true") {
            filter.rating = { $gte: 4.5 };
        }

        // Price filter
        if (minPrice || maxPrice) {
            filter.price = {};

            if (minPrice) {
                filter.price.$gte = Number(minPrice);
            }

            if (maxPrice) {
                filter.price.$lte = Number(maxPrice);
            }
        }

        // Search products
        if (search) {
            const regex = new RegExp(search.trim(), "i");

            filter.$or = [
                { name: regex },
                { description: regex },
                { brand: regex },
                { tags: regex },
            ];
        }

        // Sorting
        const sortMap = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            "price-asc": { price: 1 },
            "price-desc": { price: -1 },
            "rating-desc": { rating: -1 },
            "name-asc": { name: 1 },
        };

        const sortObject = sortMap[sort] || sortMap.newest;

        // Pagination
        const pageNumber = Math.max(
            1,
            parseInt(page, 10) || 1
        );

        const limitNumber = Math.min(
            100,
            Math.max(1, parseInt(limit, 10) || 20)
        );

        const skip = (pageNumber - 1) * limitNumber;

        // Get products and total count
        const [products, total] = await Promise.all([
            Product.find(filter)
                .sort(sortObject)
                .skip(skip)
                .limit(limitNumber),

            Product.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            count: products.length,
            total,
            page: pageNumber,
            pages: Math.ceil(total / limitNumber),
            limit: limitNumber,
            products,
        });
    } catch (error) {
        console.error("Get Products Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch products",
            error: error.message,
        });
    }
};


// ============================================
// GET FEATURED PRODUCTS
// ============================================
export const getFeaturedProducts = async (req, res) => {
    try {
        const products = await Product.find({
            rating: { $gte: 4.5 },
        })
            .sort({
                rating: -1,
                reviewsCount: -1,
            })
            .limit(8);

        return res.status(200).json({
            success: true,
            count: products.length,
            products,
        });
    } catch (error) {
        console.error("Get Featured Products Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch featured products",
            error: error.message,
        });
    }
};


// ============================================
// GET PRODUCT BY ID
// ============================================
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product Not Found",
            });
        }

        return res.status(200).json({
            success: true,
            product,
        });
    } catch (error) {
        console.error("Get Product By ID Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch product",
            error: error.message,
        });
    }
};


// ============================================
// GET PRODUCTS BY IDS
// ============================================
export const getProductsByIds = async (req, res) => {
    try {
        const ids = (req.query.ids || "")
            .split(",")
            .filter(Boolean);

        if (!ids.length) {
            return res.status(200).json({
                success: true,
                count: 0,
                products: [],
            });
        }

        const products = await Product.find({
            _id: { $in: ids },
        });

        return res.status(200).json({
            success: true,
            count: products.length,
            products,
        });
    } catch (error) {
        console.error("Get Products By IDs Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch products",
            error: error.message,
        });
    }
};

//
// ============================================
// ADMIN - CREATE PRODUCT
// ============================================
export const createProduct = async (req, res) => {
    try {
        const product = await Product.create(req.body);
        upload();

        return res.status(201).json({
            success: true,
            message: "Product Created Successfully",
            product,
        });
    } catch (error) {
        console.error("Create Product Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create product",
            error: error.message,
        });
    }
};


// ============================================
// ADMIN - UPDATE PRODUCT
// ============================================
export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product Not Found",
            });
        }
        upload();
        return res.status(200).json({
            success: true,
            message: "Product Updated Successfully",
            product,
        });
    } catch (error) {
        console.error("Update Product Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update product",
            error: error.message,
        });
    }
};


// ============================================
// ADMIN - DELETE PRODUCT
// ============================================
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(
            req.params.id
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product Not Found",
            });
        }

        upload();

        return res.status(200).json({
            success: true,
            message: "Product Deleted Successfully",
            product,
        });
    } catch (error) {
        console.error("Delete Product Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete product",
            error: error.message,
        });
    }
};


// ============================================
// GET CATEGORIES AND BRANDS
// ============================================
export const getCategories = async (req, res) => {
    try {
        const [categories, brands] = await Promise.all([
            Product.distinct("category"),
            Product.distinct("brand"),
        ]);

        return res.status(200).json({
            success: true,
            categories,
            brands,
        });
    } catch (error) {
        console.error("Get Categories Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch categories and brands",
            error: error.message,
        });
    }
};


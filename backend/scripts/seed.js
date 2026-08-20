import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import User from "../models/User.js";

dotenv.config();

const products = [
  {
    name: "iPhone 15 Pro",
    brand: "Apple",
    category: "Smartphone",
    sku: "APL-IP15P-256",
    description:
      "Apple's flagship smartphone with a titanium frame, the A17 Pro chip, and a pro-grade camera system built for photography, gaming and everyday performance.",
    price: 999,
    currency: "USD",
    discountPercent: 5,
    stock: 42,
    images: ["https://picsum.photos/seed/iphone15pro/600/600"],
    specifications: {
      Display: "6.1-inch Super Retina XDR, 120Hz ProMotion",
      Chipset: "Apple A17 Pro (3nm)",
      RAM: "8GB",
      Storage: "256GB",
      "Rear Camera": "48MP + 12MP Ultra Wide + 12MP Telephoto",
      Battery: "3274 mAh, up to 23 hours video playback",
      Build: "Titanium frame, Ceramic Shield front",
      OS: "iOS 17",
    },
    goodSides: [
      "Blazing-fast A17 Pro chip handles gaming and video editing with ease",
      "Best-in-class camera system for stunning photos and 4K cinematic video",
      "Durable, lightweight titanium build feels premium in hand",
      "5+ years of guaranteed software and security updates",
      "Seamless integration across iPhone, iPad, Mac and Apple Watch",
    ],
    rating: 4.8,
    reviewsCount: 2310,
    warranty: "1 Year Apple Limited Warranty",
    releaseYear: 2023,
    tags: ["flagship", "5G", "ios", "premium"],
  },
  {
    name: "Samsung Galaxy Tab S9",
    brand: "Samsung",
    category: "Tablet",
    sku: "SAM-TABS9-128",
    description:
      "A premium Android tablet with a stunning AMOLED display, S Pen included, and an IP68 water/dust-resistant body — great for note-taking, streaming and creative work.",
    price: 799,
    currency: "USD",
    discountPercent: 10,
    stock: 30,
    images: ["https://picsum.photos/seed/galaxytabs9/600/600"],
    specifications: {
      Display: "11-inch Dynamic AMOLED 2X, 120Hz",
      Chipset: "Snapdragon 8 Gen 2 for Galaxy",
      RAM: "8GB",
      Storage: "128GB (expandable via microSD)",
      Battery: "8400 mAh",
      "S Pen": "Included, no extra purchase needed",
      Build: "IP68 water and dust resistant",
      OS: "Android 13, One UI 5.1",
    },
    goodSides: [
      "S Pen included in the box — no extra cost for note-taking or sketching",
      "Vivid AMOLED display makes movies and games genuinely pop",
      "IP68 rating means it survives rain, spills and dusty environments",
      "DeX mode turns the tablet into a mini desktop for productivity",
      "Long battery life easily covers a full day of study or entertainment",
    ],
    rating: 4.6,
    reviewsCount: 1042,
    warranty: "1 Year Samsung Manufacturer Warranty",
    releaseYear: 2023,
    tags: ["android", "tablet", "s-pen", "productivity"],
  },
  {
    name: "Dell XPS 15 Laptop",
    brand: "Dell",
    category: "Laptop",
    sku: "DELL-XPS15-i7",
    description:
      "A powerful 15-inch laptop with a stunning InfinityEdge display, discrete graphics and all-day battery life — built for creators, developers and power users.",
    price: 1499,
    currency: "USD",
    discountPercent: 8,
    stock: 18,
    images: ["https://picsum.photos/seed/dellxps15/600/600"],
    specifications: {
      Display: "15.6-inch 3.5K OLED touch, InfinityEdge",
      Processor: "Intel Core i7 13th Gen",
      RAM: "16GB DDR5",
      Storage: "512GB NVMe SSD",
      Graphics: "NVIDIA GeForce RTX 4050 (6GB)",
      Battery: "Up to 13 hours",
      Build: "CNC-machined aluminum chassis",
      OS: "Windows 11 Home",
    },
    goodSides: [
      "Stunning 3.5K OLED display is ideal for photo and video editing",
      "Discrete RTX graphics handles creative workloads and light gaming",
      "Premium CNC aluminum build feels sturdy and travels well",
      "All-day battery life keeps up with a full workday unplugged",
      "Compact 15-inch chassis without sacrificing a full-size keyboard",
    ],
    rating: 4.5,
    reviewsCount: 876,
    warranty: "1 Year Dell Premium Support",
    releaseYear: 2023,
    tags: ["laptop", "windows", "creator", "performance"],
  },
  {
    name: "Samsung Galaxy A55 5G",
    brand: "Samsung",
    category: "Smartphone",
    sku: "SAM-A55-128",
    description:
      "A well-rounded mid-range Android phone with a bright AMOLED display, a versatile triple camera and reliable all-day battery life at an affordable price.",
    price: 449,
    currency: "USD",
    discountPercent: 12,
    stock: 65,
    images: ["https://picsum.photos/seed/galaxya55/600/600"],
    specifications: {
      Display: "6.6-inch Super AMOLED, 120Hz",
      Chipset: "Exynos 1480",
      RAM: "8GB",
      Storage: "128GB (expandable via microSD)",
      "Rear Camera": "50MP + 12MP Ultra Wide + 5MP Macro",
      Battery: "5000 mAh with 25W fast charging",
      Build: "IP67 water and dust resistant",
      OS: "Android 14, One UI 6.1",
    },
    goodSides: [
      "Excellent value — flagship-like display and camera at a mid-range price",
      "Large 5000 mAh battery comfortably lasts a full day of heavy use",
      "IP67 rating adds real durability against splashes and dust",
      "4 generations of OS updates and 5 years of security patches",
      "Expandable storage via microSD gives room to grow",
    ],
    rating: 4.4,
    reviewsCount: 1523,
    warranty: "1 Year Samsung Manufacturer Warranty",
    releaseYear: 2024,
    tags: ["android", "5G", "mid-range", "value"],
  },
  {
    name: "Whirlpool Double Door Freezer & Refrigerator",
    brand: "Whirlpool",
    category: "Home Appliance",
    sku: "WHR-DDF-380L",
    description:
      "A spacious frost-free double-door refrigerator with a dedicated freezer compartment, adaptive cooling technology and energy-efficient operation for the whole family.",
    price: 699,
    currency: "USD",
    discountPercent: 15,
    stock: 12,
    images: ["https://picsum.photos/seed/whirlpoolfreezer/600/600"],
    specifications: {
      Capacity: "380 Liters (280L Fridge + 100L Freezer)",
      Technology: "Frost-Free, IntelliSense Inverter Compressor",
      "Energy Rating": "5 Star",
      Shelving: "Toughened glass shelves, adjustable",
      "Noise Level": "38 dB",
      Warranty: "10 Years on Compressor",
      Color: "Steel Silver",
    },
    goodSides: [
      "Frost-free technology means no manual defrosting, ever",
      "Inverter compressor keeps energy bills low while running quietly",
      "Spacious 100L freezer compartment holds a week's worth of frozen food",
      "10-year compressor warranty gives real long-term peace of mind",
      "Adjustable glass shelving adapts to bottles, trays and bulk groceries",
    ],
    rating: 4.5,
    reviewsCount: 604,
    warranty: "10 Years on Compressor, 1 Year Comprehensive",
    releaseYear: 2023,
    tags: ["appliance", "kitchen", "energy-efficient", "family"],
  },
  {
    name: "Nerf Elite 2.0 Toy Blaster Gun",
    brand: "Nerf",
    category: "Toys & Games",
    sku: "NRF-ELITE2-DRP",
    description:
      "A kid-safe foam dart blaster gun with a rotating drum, adjustable sights and long-range accuracy — perfect for backyard games and family fun.",
    price: 29,
    currency: "USD",
    discountPercent: 20,
    stock: 150,
    images: ["https://picsum.photos/seed/nerfblaster/600/600"],
    specifications: {
      "Dart Capacity": "12-dart rotating drum",
      Range: "Up to 90 feet (soft foam darts)",
      "Age Recommendation": "8 years and up",
      Includes: "1 Blaster, 12 Elite foam darts, adjustable sight",
      Material: "Impact-resistant plastic",
    },
    goodSides: [
      "Safe soft foam darts — designed for active, worry-free family play",
      "12-dart rotating drum means fewer reloads and longer play sessions",
      "Adjustable sight improves aim for more satisfying long-range shots",
      "Durable, impact-resistant build holds up to rough outdoor play",
      "Great value pack — blaster and darts included, ready to play",
    ],
    rating: 4.7,
    reviewsCount: 2894,
    warranty: "90 Days Manufacturer Warranty",
    releaseYear: 2022,
    tags: ["toy", "outdoor", "kids", "family-fun"],
  },
];

const seed = async () => {
  console.log(`Connecting to MongoDB at ${process.env.MONGO_URL} ...`);
  await mongoose.connect(process.env.MONGO_URL);

  // Products: idempotent by sku
  for (const p of products) {
    await Product.updateOne({ sku: p.sku }, { $set: p }, { upsert: true });
  }
  const productCount = await Product.countDocuments();
  console.log(`Products in DB: ${productCount}`);

  // Default admin from .env
  const adminEmail = process.env.ADMIN_EMAIL.toLowerCase();
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD,
      name: "Site Admin",
      role: "admin",
      isVerified: true,
      verifiedAt: new Date(),
    });
    console.log(`Created admin user ${adminEmail}`);
  } else {
    console.log(`Admin user ${adminEmail} already exists`);
  }

  await mongoose.disconnect();
  console.log("Seed complete.");
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});

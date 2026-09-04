import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
dotenv.config();

import Inventory from "../src/models/inventory.model.js";
import LocationProfile from "../src/models/locationProfile.model.js";
import StorefrontInventory from "../src/models/storefrontInventory.model.js";

const poolProducts = [
  {
    productName: "Professional UV Swimming Goggles (ရေကူးမျက်မှန်)",
    productCode: "POOL-GOGGLE-01",
    SKU: "SKU-POOL-001",
    barcode: "885100100001",
    category: "Pool & Swim Equipment",
    subCategory: "Swim Wear & Accessories",
    buyingPrice: 15000,
    sellingPrice: 25000,
    unitOfMeasure: "piece",
    stock: 40,
    description: "High quality UV protection and anti-fog swimming goggles",
  },
  {
    productName: "Anti-Fog Silicone Swim Cap (ရေကူး ဦးထုပ်)",
    productCode: "POOL-CAP-02",
    SKU: "SKU-POOL-002",
    barcode: "885100100002",
    category: "Pool & Swim Equipment",
    subCategory: "Swim Wear & Accessories",
    buyingPrice: 6000,
    sellingPrice: 10000,
    unitOfMeasure: "piece",
    stock: 50,
    description: "Durable 100% silicone waterproof swim cap for adults and kids",
  },
  {
    productName: "Electric Pool Filter Pump 1.5HP (ရေကူးကန် ဖစ်လ်တာ ပန့်)",
    productCode: "POOL-PUMP-03",
    SKU: "SKU-POOL-003",
    barcode: "885100100003",
    category: "Pool & Swim Equipment",
    subCategory: "Pool Maintenance & Machinery",
    buyingPrice: 350000,
    sellingPrice: 480000,
    unitOfMeasure: "set",
    stock: 10,
    description: "1.5HP high performance circulating filter pump for swimming pools",
  },
  {
    productName: "Giant Inflatable Flamingo Pool Float (ဖလင်မင်ဂို ဘောကွင်းကြီး)",
    productCode: "POOL-FLOAT-04",
    SKU: "SKU-POOL-004",
    barcode: "885100100004",
    category: "Pool & Swim Equipment",
    subCategory: "Floats & Water Toys",
    buyingPrice: 32000,
    sellingPrice: 50000,
    unitOfMeasure: "piece",
    stock: 25,
    description: "Giant inflatable flamingo lounge float for pool fun",
  },
  {
    productName: "Adjustable Kids Arm Swim Rings (ကလေး လက်မောင်း ဘောကွင်း)",
    productCode: "POOL-ARM-05",
    SKU: "SKU-POOL-005",
    barcode: "885100100005",
    category: "Pool & Swim Equipment",
    subCategory: "Floats & Water Toys",
    buyingPrice: 4000,
    sellingPrice: 7500,
    unitOfMeasure: "pair",
    stock: 60,
    description: "Safety inflatable arm bands for kids learning to swim",
  },
  {
    productName: "Professional Training Swimming Fins (ရေကူး ခြေတောင်)",
    productCode: "POOL-FINS-06",
    SKU: "SKU-POOL-006",
    barcode: "885100100006",
    category: "Pool & Swim Equipment",
    subCategory: "Swim Wear & Accessories",
    buyingPrice: 28000,
    sellingPrice: 42000,
    unitOfMeasure: "pair",
    stock: 20,
    description: "Ergonomic swim flippers for swimming speed and leg training",
  },
  {
    productName: "Pool Chlorine Tablets 90% 1kg (ရေကူးကန် ကလော်ရီးဆေးပြား 1kg)",
    productCode: "POOL-CHLOR-07",
    SKU: "SKU-POOL-007",
    barcode: "885100100007",
    category: "Pool & Swim Equipment",
    subCategory: "Pool Maintenance & Chemicals",
    buyingPrice: 18000,
    sellingPrice: 28000,
    unitOfMeasure: "pack",
    stock: 35,
    description: "90% concentrated slow dissolving chlorine tablets for water sanitation",
  },
  {
    productName: "Heavy Duty Leaf Skimmer Mesh Net (ရေကူးကန် သန့်ရှင်းရေး ပိုက်ကွန်)",
    productCode: "POOL-NET-08",
    SKU: "SKU-POOL-008",
    barcode: "885100100008",
    category: "Pool & Swim Equipment",
    subCategory: "Pool Maintenance & Tools",
    buyingPrice: 12000,
    sellingPrice: 20000,
    unitOfMeasure: "piece",
    stock: 30,
    description: "Deep mesh leaf skimmer net with aluminum frame for pool cleaning",
  },
  {
    productName: "Flexible Pool Vacuum Hose 10m (ရေကူးကန် ဖုန်စုပ်ပိုက် ၁၀ မီတာ)",
    productCode: "POOL-HOSE-09",
    SKU: "SKU-POOL-009",
    barcode: "885100100009",
    category: "Pool & Swim Equipment",
    subCategory: "Pool Maintenance & Tools",
    buyingPrice: 45000,
    sellingPrice: 68000,
    unitOfMeasure: "piece",
    stock: 15,
    description: "10-meter heavy duty spiral wound pool suction vacuum hose",
  },
  {
    productName: "Weighted Pool Vacuum Head Brush (ရေကူးကန် ဘရပ်ရှ် ဖုန်စုပ်ခေါင်း)",
    productCode: "POOL-VAC-10",
    SKU: "SKU-POOL-010",
    barcode: "885100100010",
    category: "Pool & Swim Equipment",
    subCategory: "Pool Maintenance & Tools",
    buyingPrice: 22000,
    sellingPrice: 35000,
    unitOfMeasure: "piece",
    stock: 20,
    description: "Weighted flexible vacuum head with side brushes for pool floor cleaning",
  },
  {
    productName: "EVA Foam Swimming Kickboard (ရေကူး လေ့ကျင့်ရေး ပျဉ်ပြား)",
    productCode: "POOL-KICK-11",
    SKU: "SKU-POOL-011",
    barcode: "885100100011",
    category: "Pool & Swim Equipment",
    subCategory: "Training & Safety",
    buyingPrice: 8500,
    sellingPrice: 14000,
    unitOfMeasure: "piece",
    stock: 45,
    description: "High density EVA foam swim board for leg workout training",
  },
  {
    productName: "Pool Water Test Kit pH & Chlorine (ရေကူးကန် ရေဓာတ်စစ်ကိရိယာ)",
    productCode: "POOL-TEST-12",
    SKU: "SKU-POOL-012",
    barcode: "885100100012",
    category: "Pool & Swim Equipment",
    subCategory: "Pool Maintenance & Chemicals",
    buyingPrice: 14000,
    sellingPrice: 22000,
    unitOfMeasure: "set",
    stock: 25,
    description: "2-way liquid test kit for measuring pH and chlorine levels",
  },
  {
    productName: "Professional Adult Safety Life Jacket (အသက်ကယ် အင်္ကျီ)",
    productCode: "POOL-VEST-13",
    SKU: "SKU-POOL-013",
    barcode: "885100100013",
    category: "Pool & Swim Equipment",
    subCategory: "Training & Safety",
    buyingPrice: 25000,
    sellingPrice: 38000,
    unitOfMeasure: "piece",
    stock: 30,
    description: "High visibility adult safety buoyancy life vest jacket",
  },
  {
    productName: "3-Step Stainless Steel Pool Ladder (စတီးလ် ရေကူးကန် လှေကား ၃ ထစ်)",
    productCode: "POOL-LAD-14",
    SKU: "SKU-POOL-014",
    barcode: "885100100014",
    category: "Pool & Swim Equipment",
    subCategory: "Pool Fittings & Hardware",
    buyingPrice: 180000,
    sellingPrice: 260000,
    unitOfMeasure: "set",
    stock: 8,
    description: "Anti-slip 304 stainless steel in-ground pool entry ladder",
  },
  {
    productName: "RGB Underwater LED Pool Light 35W (ရေအောက် LED မီးဆိုင်း 35W)",
    productCode: "POOL-LED-15",
    SKU: "SKU-POOL-015",
    barcode: "885100100015",
    category: "Pool & Swim Equipment",
    subCategory: "Pool Fittings & Hardware",
    buyingPrice: 55000,
    sellingPrice: 85000,
    unitOfMeasure: "set",
    stock: 18,
    description: "35W waterproof IP68 RGB color changing LED underwater light",
  },
  {
    productName: "Water Hammock Lounge Pool Chair (ရေပေါ် အနားယူ ဖျာ/ကုလားထိုင်)",
    productCode: "POOL-HAMM-16",
    SKU: "SKU-POOL-016",
    barcode: "885100100016",
    category: "Pool & Swim Equipment",
    subCategory: "Floats & Water Toys",
    buyingPrice: 16000,
    sellingPrice: 26000,
    unitOfMeasure: "piece",
    stock: 35,
    description: "4-in-1 multi-purpose inflatable water hammock floating chair",
  },
  {
    productName: "Soft Silicone Earplugs & Nose Clip Set (နားပလပ် နှာခေါင်းညှပ် အစုံ)",
    productCode: "POOL-EAR-17",
    SKU: "SKU-POOL-017",
    barcode: "885100100017",
    category: "Pool & Swim Equipment",
    subCategory: "Swim Wear & Accessories",
    buyingPrice: 3000,
    sellingPrice: 5500,
    unitOfMeasure: "set",
    stock: 70,
    description: "Reusable waterproof silicone earplugs and nose clip combo",
  },
  {
    productName: "Dry Top Diving Snorkel & Mask Set (ငုပ်လျှိုး ရေကူးမှန် နှာခေါင်းပိုက် အစုံ)",
    productCode: "POOL-SNORKEL-18",
    SKU: "SKU-POOL-018",
    barcode: "885100100018",
    category: "Pool & Swim Equipment",
    subCategory: "Swim Wear & Accessories",
    buyingPrice: 35000,
    sellingPrice: 55000,
    unitOfMeasure: "set",
    stock: 22,
    description: "Tempered glass scuba diving mask with 100% dry top snorkel",
  },
  {
    productName: "Automatic Robotic Pool Cleaner (အလိုအလျောက် ရေကူးကန် သန့်ရှင်းရေး ရောဘော့)",
    productCode: "POOL-ROBOT-19",
    SKU: "SKU-POOL-019",
    barcode: "885100100019",
    category: "Pool & Swim Equipment",
    subCategory: "Pool Maintenance & Machinery",
    buyingPrice: 850000,
    sellingPrice: 1200000,
    unitOfMeasure: "unit",
    stock: 5,
    description: "Smart automatic robotic pool floor and wall scrubbing vacuum cleaner",
  },
  {
    productName: "Inflatable Family Swimming Pool 3.05m (မိသားစုသုံး ရေကူးကန် လေထိုး)",
    productCode: "POOL-INFLATABLE-20",
    SKU: "SKU-POOL-020",
    barcode: "885100100020",
    category: "Pool & Swim Equipment",
    subCategory: "Floats & Water Toys",
    buyingPrice: 95000,
    sellingPrice: 145000,
    unitOfMeasure: "set",
    stock: 12,
    description: "Large 3.05m 3-tier thick PVC inflatable family garden pool",
  },
];

async function seedSwimmingPoolProducts() {
  console.log("==================================================================");
  console.log(" SEEDING 20 SWIMMING POOL EQUIPMENT ITEMS INTO INVENTORY         ");
  console.log("==================================================================");

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI environment variable is missing!");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("DB Connected successfully.\n");

    // Get primary Storefront location
    let storefront = await LocationProfile.findOne({ type: "storefront", isDeleted: false });
    if (!storefront) {
      storefront = await LocationProfile.create({
        locationName: "Main Storefront",
        locationCode: `STR-MAIN-${Date.now()}`,
        locationAddress: "Yangon Central Hub",
        locationPhone: "09971113344",
        type: "storefront",
        status: "active",
      });
    }

    const createdItems = [];

    for (const itemData of poolProducts) {
      const { stock, ...inventoryPayload } = itemData;

      // Upsert Inventory product
      let product = await Inventory.findOne({ productCode: inventoryPayload.productCode });
      if (product) {
        product.productName = inventoryPayload.productName;
        product.buyingPrice = inventoryPayload.buyingPrice;
        product.sellingPrice = inventoryPayload.sellingPrice;
        product.barcode = inventoryPayload.barcode;
        product.SKU = inventoryPayload.SKU;
        product.category = inventoryPayload.category;
        product.subCategory = inventoryPayload.subCategory;
        product.description = inventoryPayload.description;
        product.status = "active";
        await product.save();
      } else {
        product = await Inventory.create({
          ...inventoryPayload,
          status: "active",
        });
      }

      // Upsert Storefront Stock
      let sfStock = await StorefrontInventory.findOne({
        storefrontId: storefront._id,
        inventoryId: product._id,
      });

      if (sfStock) {
        sfStock.quantity = stock;
        await sfStock.save();
      } else {
        sfStock = await StorefrontInventory.create({
          storefrontId: storefront._id,
          inventoryId: product._id,
          quantity: stock,
        });
      }

      createdItems.push({
        id: product._id.toString(),
        productName: product.productName,
        productCode: product.productCode,
        barcode: product.barcode,
        buyingPrice: product.buyingPrice,
        sellingPrice: product.sellingPrice,
        stock: sfStock.quantity,
      });

      console.log(`✅ [SEEDED] ${product.productCode}: ${product.productName} | Selling: ${product.sellingPrice.toLocaleString()} MMK | Stock: ${sfStock.quantity}`);
    }

    console.log("\n==================================================================");
    console.log(`SUCCESSFULLY SEEDED ${createdItems.length} SWIMMING POOL PRODUCTS!`);
    console.log("==================================================================");

    return createdItems;
  } catch (err) {
    console.error("Failed to seed swimming pool products:", err);
    throw err;
  } finally {
    await mongoose.disconnect();
  }
}

seedSwimmingPoolProducts()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

import fetch from 'node-fetch'; // or use native fetch if Node >= 18
import fs from 'fs';

const API_BASE_URL = 'http://localhost:5000/api'; // Change port if needed
const ADMIN_EMAIL = 'admin@ocean.com'; // Replace with actual admin email
const ADMIN_PASSWORD = 'password'; // Replace with actual password

const poolEquipment = [
  { productName: "Swimming Pool Water Pump (2.0 HP)", productCode: "POOL-PUMP-001", SKU: "SKU-POOL-001", category: "Pool Equipment", subCategory: "Pumps", buyingPrice: 250000, sellingPrice: 320000, unitOfMeasure: "piece", status: "active" },
  { productName: "Pool Sand Filter (24 Inch)", productCode: "POOL-FLTR-002", SKU: "SKU-POOL-002", category: "Pool Equipment", subCategory: "Filters", buyingPrice: 350000, sellingPrice: 420000, unitOfMeasure: "piece", status: "active" },
  { productName: "Chlorine Tablets (1KG)", productCode: "POOL-CHM-003", SKU: "SKU-POOL-003", category: "Chemicals", subCategory: "Chlorine", buyingPrice: 15000, sellingPrice: 22000, unitOfMeasure: "kg", status: "active" },
  { productName: "Pool Skimmer Net with Pole", productCode: "POOL-ACC-004", SKU: "SKU-POOL-004", category: "Accessories", subCategory: "Cleaning", buyingPrice: 25000, sellingPrice: 35000, unitOfMeasure: "set", status: "active" },
  { productName: "18-inch Pool Cleaning Brush", productCode: "POOL-ACC-005", SKU: "SKU-POOL-005", category: "Accessories", subCategory: "Cleaning", buyingPrice: 12000, sellingPrice: 18000, unitOfMeasure: "piece", status: "active" },
  { productName: "Underwater LED Pool Light", productCode: "POOL-LHT-006", SKU: "SKU-POOL-006", category: "Accessories", subCategory: "Lighting", buyingPrice: 45000, sellingPrice: 65000, unitOfMeasure: "piece", status: "active" },
  { productName: "pH Plus Powder (1KG)", productCode: "POOL-CHM-007", SKU: "SKU-POOL-007", category: "Chemicals", subCategory: "Balancers", buyingPrice: 8000, sellingPrice: 12000, unitOfMeasure: "kg", status: "active" },
  { productName: "pH Minus Powder (1KG)", productCode: "POOL-CHM-008", SKU: "SKU-POOL-008", category: "Chemicals", subCategory: "Balancers", buyingPrice: 8500, sellingPrice: 12500, unitOfMeasure: "kg", status: "active" },
  { productName: "Pool Algaecide (1 Liter)", productCode: "POOL-CHM-009", SKU: "SKU-POOL-009", category: "Chemicals", subCategory: "Algaecide", buyingPrice: 18000, sellingPrice: 25000, unitOfMeasure: "liter", status: "active" },
  { productName: "Automatic Pool Cleaner", productCode: "POOL-MAC-010", SKU: "SKU-POOL-010", category: "Pool Equipment", subCategory: "Cleaners", buyingPrice: 1200000, sellingPrice: 1600000, unitOfMeasure: "piece", status: "active" },
  { productName: "Pool Thermometer", productCode: "POOL-ACC-011", SKU: "SKU-POOL-011", category: "Accessories", subCategory: "Testing", buyingPrice: 5000, sellingPrice: 8500, unitOfMeasure: "piece", status: "active" },
  { productName: "Water Testing Kit (5-in-1)", productCode: "POOL-ACC-012", SKU: "SKU-POOL-012", category: "Accessories", subCategory: "Testing", buyingPrice: 15000, sellingPrice: 22000, unitOfMeasure: "piece", status: "active" },
  { productName: "Pool Cover", productCode: "POOL-CVR-013", SKU: "SKU-POOL-013", category: "Accessories", subCategory: "Covers", buyingPrice: 85000, sellingPrice: 120000, unitOfMeasure: "piece", status: "active" },
  { productName: "Stainless Steel Pool Ladder", productCode: "POOL-ACC-014", SKU: "SKU-POOL-014", category: "Pool Equipment", subCategory: "Ladders", buyingPrice: 150000, sellingPrice: 210000, unitOfMeasure: "piece", status: "active" },
  { productName: "Inflatable Pool Float", productCode: "POOL-TOY-015", SKU: "SKU-POOL-015", category: "Accessories", subCategory: "Floats", buyingPrice: 20000, sellingPrice: 35000, unitOfMeasure: "piece", status: "active" },
  { productName: "Filter Sand (25KG)", productCode: "POOL-FLTR-016", SKU: "SKU-POOL-016", category: "Pool Equipment", subCategory: "Filter Media", buyingPrice: 18000, sellingPrice: 25000, unitOfMeasure: "bag", status: "active" },
  { productName: "Swimming Pool Heat Pump", productCode: "POOL-MAC-017", SKU: "SKU-POOL-017", category: "Pool Equipment", subCategory: "Heaters", buyingPrice: 2500000, sellingPrice: 3200000, unitOfMeasure: "piece", status: "active" },
  { productName: "Pool Hose (30 ft)", productCode: "POOL-ACC-018", SKU: "SKU-POOL-018", category: "Accessories", subCategory: "Cleaning", buyingPrice: 35000, sellingPrice: 50000, unitOfMeasure: "piece", status: "active" },
  { productName: "Vacuum Head with Wheels", productCode: "POOL-ACC-019", SKU: "SKU-POOL-019", category: "Accessories", subCategory: "Cleaning", buyingPrice: 40000, sellingPrice: 60000, unitOfMeasure: "piece", status: "active" },
  { productName: "Water Clarifier", productCode: "POOL-CHM-020", SKU: "SKU-POOL-020", category: "Chemicals", subCategory: "Clarifiers", buyingPrice: 15000, sellingPrice: 22000, unitOfMeasure: "liter", status: "active" }
];

async function seedViaAPI() {
  try {
    console.log("Logging in...");
    // 1. Get Auth Token
    const loginRes = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });

    if (!loginRes.ok) {
      const errorText = await loginRes.text();
      throw new Error(`Login failed: ${loginRes.status} ${errorText}`);
    }

    const loginData = await loginRes.json();
    const token = loginData.token || loginData.data?.token; 
    
    if (!token) throw new Error("Could not extract token from login response");

    console.log("Logged in successfully. Starting to add products...");

    // 2. Add each product
    let successCount = 0;
    for (const item of poolEquipment) {
      const res = await fetch(`${API_BASE_URL}/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(item)
      });

      if (res.ok) {
        successCount++;
        console.log(`✅ Added: ${item.productName}`);
      } else {
        const errorText = await res.text();
        console.log(`❌ Failed to add: ${item.productName} - ${errorText}`);
      }
    }

    console.log(`\nFinished! Successfully added ${successCount} out of ${poolEquipment.length} products.`);

  } catch (error) {
    console.error("Error during API seeding:", error.message);
  }
}

seedViaAPI();

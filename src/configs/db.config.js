import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

export const Db = async () => {
  try {
    mongoose.set("strictQuery", false);
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`Database Connected: ${conn.connection.host}`);

    // Drop unique index on purchasingId for GRN model (one-time migration)
    // This allows multiple GRNs per PO for partial receiving
    try {
      const collection =
        mongoose.connection.db.collection("goodsrecievednotes");
      const indexes = await collection.indexes();

      // Find and drop the unique index on purchasingId if it exists
      const uniqueIndex = indexes.find(
        (index) =>
          index.key && index.key.purchasingId === 1 && index.unique === true
      );

      if (uniqueIndex) {
        await collection.dropIndex(uniqueIndex.name);
        console.log(
          `✓ Dropped unique index on purchasingId: ${uniqueIndex.name}`
        );
      }
    } catch (indexError) {
      // Index might not exist, which is fine
      if (indexError.code === 27 || indexError.codeName === "IndexNotFound") {
        // Index doesn't exist, which is expected after first run
      } else {
        console.log(
          "Note: Could not drop purchasingId unique index:",
          indexError.message
        );
      }
    }

    // Drop legacy unique index on telegramChatId for Admin model (one-time migration)
    // The field is now guarded by a partial unique index (string values only),
    // so the old sparse/unique index must be removed to avoid null-collision.
    try {
      const adminCollection = mongoose.connection.db.collection("admins");
      const adminIndexes = await adminCollection.indexes();

      // Legacy index: unique on telegramChatId WITHOUT a partialFilterExpression
      const legacyTelegramIndex = adminIndexes.find(
        (index) =>
          index.key &&
          index.key.telegramChatId === 1 &&
          index.unique === true &&
          !index.partialFilterExpression
      );

      if (legacyTelegramIndex) {
        await adminCollection.dropIndex(legacyTelegramIndex.name);
        console.log(
          `✓ Dropped legacy unique index on telegramChatId: ${legacyTelegramIndex.name}`
        );
      }
    } catch (indexError) {
      if (indexError.code === 27 || indexError.codeName === "IndexNotFound") {
        // Index doesn't exist, which is expected after first run
      } else {
        console.log(
          "Note: Could not drop telegramChatId unique index:",
          indexError.message
        );
      }
    }
  } catch (error) {
    console.log("Database connection failed:", error.message);
    process.exit(1);
  }
};

export default Db;

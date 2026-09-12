import mongoose from "mongoose";
import Transfer from "../models/transfer.model.js";
import GoodsRecievedNote from "../models/goodsRecievedNote.model.js";
import LocationProfile from "../models/locationProfile.model.js";
import WarehouseStock from "../models/warehouse.model.js";
import StorefrontInventory from "../models/storefrontInventory.model.js";
import Inventory from "../models/inventory.model.js";
import { asyncErrorHandler } from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";

// Helper to safely populate source and destination for a transfer document
const populateTransferDetails = async (transfer) => {
  if (transfer.sourceType === "GRN") {
    await transfer.populate("sourceId", "grnNumber status");
  } else if (
    transfer.sourceType === "Warehouse" ||
    transfer.sourceType === "Storefront"
  ) {
    await transfer.populate("sourceId", "locationName locationCode type");
  }

  if (transfer.destinationWarehouseId) {
    await transfer.populate(
      "destinationWarehouseId",
      "locationName locationCode type"
    );
  }
  if (transfer.destinationStorefrontId) {
    await transfer.populate(
      "destinationStorefrontId",
      "locationName locationCode type"
    );
  }

  await transfer.populate(
    "lineItems.inventoryId",
    "productName productCode SKU"
  );
  await transfer.populate("transferredBy", "name role");
};

// Create new Transfer (supports all 5 pipelines: GRN->WH, WH->SF, WH->WH, SF->SF, SF->WH)
export const createTransfer = asyncErrorHandler(async (req, res, next) => {
  if (!req.user || !req.user._id) {
    return next(
      new CustomError(
        401,
        "Authentication required. Admin account ID is missing."
      )
    );
  }
  const transferredBy = req.user._id;

  const {
    sourceType, // "GRN" | "Warehouse" | "Storefront"
    grnId,
    sourceWarehouseId,
    sourceStorefrontId,
    sourceId: rawSourceId,
    destinationWarehouseId: rawDestWarehouseId,
    destinationStorefrontId: rawDestStorefrontId,
    destinationId, // Optional generic destination ID
    destinationType, // Optional generic destination type ("warehouse" | "storefront")
    lineItems,
    lineitems,
    transferDate,
    notes,
  } = req.body;

  const transferLineItems = lineItems || lineitems;

  // Determine sourceType
  const transferSourceType =
    sourceType ||
    (grnId ? "GRN" : sourceWarehouseId ? "Warehouse" : sourceStorefrontId ? "Storefront" : null);

  if (
    !transferSourceType ||
    !["GRN", "Warehouse", "Storefront"].includes(transferSourceType)
  ) {
    return next(
      new CustomError(
        400,
        "sourceType is required and must be 'GRN', 'Warehouse', or 'Storefront'"
      )
    );
  }

  // Determine sourceId
  let sourceId =
    rawSourceId ||
    (transferSourceType === "GRN"
      ? grnId
      : transferSourceType === "Warehouse"
      ? sourceWarehouseId
      : sourceStorefrontId);

  if (!sourceId) {
    return next(
      new CustomError(
        400,
        `Source ID is required for ${transferSourceType} transfer`
      )
    );
  }

  if (!mongoose.Types.ObjectId.isValid(sourceId)) {
    return next(new CustomError(400, "Invalid source ID format"));
  }

  // Determine destination IDs
  let destinationWarehouseId = rawDestWarehouseId || null;
  let destinationStorefrontId = rawDestStorefrontId || null;

  if (destinationId && !destinationWarehouseId && !destinationStorefrontId) {
    if (!mongoose.Types.ObjectId.isValid(destinationId)) {
      return next(new CustomError(400, "Invalid destination ID format"));
    }
    const destLocation = await LocationProfile.findById(destinationId);
    if (!destLocation) {
      return next(new CustomError(404, "Destination location not found"));
    }
    if (destLocation.type === "warehouse") {
      destinationWarehouseId = destinationId;
    } else if (destLocation.type === "storefront") {
      destinationStorefrontId = destinationId;
    }
  }

  // Validate destinations
  if (!destinationWarehouseId && !destinationStorefrontId) {
    return next(
      new CustomError(
        400,
        "Either destinationWarehouseId or destinationStorefrontId is required"
      )
    );
  }

  if (destinationWarehouseId && destinationStorefrontId) {
    return next(
      new CustomError(
        400,
        "Cannot specify both destinationWarehouseId and destinationStorefrontId"
      )
    );
  }

  const effectiveDestId = destinationWarehouseId || destinationStorefrontId;
  if (effectiveDestId && !mongoose.Types.ObjectId.isValid(effectiveDestId)) {
    return next(new CustomError(400, "Invalid destination ID format"));
  }

  // Prevent transferring to the same location
  if (sourceId.toString() === effectiveDestId.toString()) {
    return next(
      new CustomError(
        400,
        "Source location and destination location cannot be the same"
      )
    );
  }

  // Validate lineItems
  if (
    !transferLineItems ||
    !Array.isArray(transferLineItems) ||
    transferLineItems.length === 0
  ) {
    return next(
      new CustomError(
        400,
        "Line items are required and must be a non-empty array"
      )
    );
  }

  // Validate source location existence and status
  if (transferSourceType === "GRN") {
    const grn = await GoodsRecievedNote.findById(sourceId).lean();
    if (!grn) {
      return next(new CustomError(404, "GRN not found"));
    }
    if (grn.isDeleted) {
      return next(
        new CustomError(400, "Cannot create transfer from deleted GRN")
      );
    }
    if (grn.status !== "partial" && grn.status !== "verified") {
      return next(
        new CustomError(
          400,
          `Cannot create transfer from GRN with status '${grn.status}'. Only GRNs with status 'partial' or 'verified' can have transfers created.`
        )
      );
    }
    if (!grn.lineItems || grn.lineItems.length === 0) {
      return next(new CustomError(400, "GRN has no line items"));
    }
  } else if (transferSourceType === "Warehouse") {
    const sourceWarehouse = await LocationProfile.findOne({
      _id: sourceId,
      type: "warehouse",
    });
    if (!sourceWarehouse) {
      return next(new CustomError(404, "Source warehouse not found"));
    }
    if (sourceWarehouse.isDeleted || sourceWarehouse.status === "inactive") {
      return next(
        new CustomError(
          400,
          "Cannot create transfer from deleted or inactive warehouse"
        )
      );
    }
  } else if (transferSourceType === "Storefront") {
    const sourceStorefront = await LocationProfile.findOne({
      _id: sourceId,
      type: "storefront",
    });
    if (!sourceStorefront) {
      return next(new CustomError(404, "Source storefront not found"));
    }
    if (sourceStorefront.isDeleted || sourceStorefront.status === "inactive") {
      return next(
        new CustomError(
          400,
          "Cannot create transfer from deleted or inactive storefront"
        )
      );
    }
  }

  // Validate destination location existence and status
  if (destinationWarehouseId) {
    const destWarehouse = await LocationProfile.findOne({
      _id: destinationWarehouseId,
      type: "warehouse",
    });
    if (!destWarehouse) {
      return next(new CustomError(404, "Destination warehouse not found"));
    }
    if (destWarehouse.isDeleted || destWarehouse.status === "inactive") {
      return next(
        new CustomError(
          400,
          "Cannot transfer to deleted or inactive warehouse"
        )
      );
    }
  } else if (destinationStorefrontId) {
    const destStorefront = await LocationProfile.findOne({
      _id: destinationStorefrontId,
      type: "storefront",
    });
    if (!destStorefront) {
      return next(new CustomError(404, "Destination storefront not found"));
    }
    if (destStorefront.isDeleted || destStorefront.status === "inactive") {
      return next(
        new CustomError(
          400,
          "Cannot transfer to deleted or inactive storefront"
        )
      );
    }
  }

  // Validate line items and stock availability
  const validatedLineItems = [];

  for (const userItem of transferLineItems) {
    if (!userItem.productCode) {
      return next(new CustomError(400, "Each line item must have productCode"));
    }

    if (userItem.quantity === undefined || userItem.quantity === null) {
      return next(
        new CustomError(400, "Transfer quantity is required for all line items")
      );
    }

    if (typeof userItem.quantity !== "number" || userItem.quantity <= 0) {
      return next(
        new CustomError(
          400,
          "Transfer quantity must be a positive number greater than 0"
        )
      );
    }

    // Lookup inventory by productCode
    const inventory = await Inventory.findOne({
      productCode: userItem.productCode.toUpperCase(),
    }).lean();

    if (!inventory) {
      return next(
        new CustomError(
          404,
          `Product with code '${userItem.productCode}' not found`
        )
      );
    }

    const inventoryIdValue = inventory._id;

    if (transferSourceType === "GRN") {
      const grn = await GoodsRecievedNote.findById(sourceId).lean();
      const grnLineItem = grn.lineItems.find(
        (item) => item.inventoryId.toString() === inventoryIdValue.toString()
      );

      if (!grnLineItem) {
        return next(
          new CustomError(
            400,
            `GRN does not contain product with code '${userItem.productCode}'.`
          )
        );
      }

      const goodQuantity = grnLineItem.goodQuantity || 0;
      const transferredQuantity = grnLineItem.transferredQuantity || 0;
      const availableQuantity = goodQuantity - transferredQuantity;

      if (userItem.quantity > availableQuantity) {
        return next(
          new CustomError(
            400,
            `Transfer quantity (${userItem.quantity}) exceeds available quantity (${availableQuantity}) for product '${userItem.productCode}'`
          )
        );
      }

      validatedLineItems.push({
        inventoryId: inventoryIdValue,
        quantity: userItem.quantity,
        grnLineItemId: grnLineItem._id,
        notes: userItem.notes || null,
      });
    } else if (transferSourceType === "Warehouse") {
      const warehouseStock = await WarehouseStock.findOne({
        inventoryId: inventoryIdValue,
        warehouseId: sourceId,
      }).lean();

      if (!warehouseStock) {
        return next(
          new CustomError(
            404,
            `Warehouse stock not found for product '${userItem.productCode}' in source warehouse`
          )
        );
      }

      const availableQuantity = warehouseStock.quantity || 0;
      if (userItem.quantity > availableQuantity) {
        return next(
          new CustomError(
            400,
            `Transfer quantity (${userItem.quantity}) exceeds available warehouse stock (${availableQuantity}) for product '${userItem.productCode}'`
          )
        );
      }

      validatedLineItems.push({
        inventoryId: inventoryIdValue,
        quantity: userItem.quantity,
        notes: userItem.notes || null,
      });
    } else if (transferSourceType === "Storefront") {
      const storefrontStock = await StorefrontInventory.findOne({
        inventoryId: inventoryIdValue,
        storefrontId: sourceId,
      }).lean();

      if (!storefrontStock) {
        return next(
          new CustomError(
            404,
            `Storefront stock not found for product '${userItem.productCode}' in source storefront`
          )
        );
      }

      const availableQuantity = storefrontStock.quantity || 0;
      if (userItem.quantity > availableQuantity) {
        return next(
          new CustomError(
            400,
            `Transfer quantity (${userItem.quantity}) exceeds available storefront stock (${availableQuantity}) for product '${userItem.productCode}'`
          )
        );
      }

      validatedLineItems.push({
        inventoryId: inventoryIdValue,
        quantity: userItem.quantity,
        notes: userItem.notes || null,
      });
    }
  }

  // Ensure inventory items exist in destination
  try {
    if (destinationWarehouseId) {
      for (const lineItem of validatedLineItems) {
        const existingWarehouseStock = await WarehouseStock.findOne({
          inventoryId: lineItem.inventoryId,
          warehouseId: destinationWarehouseId,
        });

        if (!existingWarehouseStock) {
          await WarehouseStock.create({
            inventoryId: lineItem.inventoryId,
            warehouseId: destinationWarehouseId,
            quantity: 0,
          });
        }
      }
    } else if (destinationStorefrontId) {
      for (const lineItem of validatedLineItems) {
        const existingStorefrontInventory = await StorefrontInventory.findOne({
          inventoryId: lineItem.inventoryId,
          storefrontId: destinationStorefrontId,
        });

        if (!existingStorefrontInventory) {
          await StorefrontInventory.create({
            inventoryId: lineItem.inventoryId,
            storefrontId: destinationStorefrontId,
            quantity: 0,
          });
        }
      }
    }
  } catch (error) {
    return next(
      new CustomError(
        500,
        `Error initializing destination inventory: ${error.message}`
      )
    );
  }

  // Auto-generate transfer number
  const transferNumber = await Transfer.generateTransferNumber();

  // MongoDB transaction to transfer stock atomically
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const transferData = {
      transferNumber,
      sourceType: transferSourceType,
      sourceId,
      destinationWarehouseId,
      destinationStorefrontId,
      lineItems: validatedLineItems,
      transferDate: transferDate || new Date(),
      notes: notes || null,
      status: "completed",
      transferredBy,
    };

    const newTransferArray = await Transfer.create([transferData], { session });
    const transfer = newTransferArray[0];

    // Atomically transfer stock
    await transfer.updateStock(session);

    transfer.receivedDate = new Date();
    await transfer.save({ session });

    await session.commitTransaction();
    await session.endSession();

    // Populate references for response
    await populateTransferDetails(transfer);

    res.status(201).json({
      success: true,
      message: "Transfer created and stock transferred successfully",
      data: transfer,
    });
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    return next(
      new CustomError(500, `Failed to create transfer: ${error.message}`)
    );
  }
});

// Fetch all transfers
export const getTransfers = asyncErrorHandler(async (req, res, next) => {
  const transfers = await Transfer.find()
    .populate("transferredBy", "name role")
    .populate("lineItems.inventoryId", "productName productCode SKU")
    .populate("destinationWarehouseId", "locationName locationCode type")
    .populate("destinationStorefrontId", "locationName locationCode type")
    .sort({ createdAt: -1 });

  for (const transfer of transfers) {
    if (transfer.sourceType === "GRN") {
      await transfer.populate("sourceId", "grnNumber status");
    } else if (
      transfer.sourceType === "Warehouse" ||
      transfer.sourceType === "Storefront"
    ) {
      await transfer.populate("sourceId", "locationName locationCode type");
    }
  }

  res.status(200).json({
    success: true,
    message: "Transfers fetched successfully",
    data: transfers,
  });
});

// Fetch single transfer by ID
export const getTransferById = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const transfer = await Transfer.findById(id);

  if (!transfer) {
    return next(new CustomError(404, "Transfer not found"));
  }

  await populateTransferDetails(transfer);

  res.status(200).json({
    success: true,
    message: "Transfer fetched successfully",
    data: transfer,
  });
});

// Update transfer status
export const updateTransferStatus = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return next(new CustomError(400, "Status is required"));
    }
    const validStatuses = ["pending", "in-transit", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return next(
        new CustomError(
          400,
          `Invalid status. Allowed values: ${validStatuses.join(", ")}`
        )
      );
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const updatedTransfer = await Transfer.findByIdAndUpdate(
        id,
        { status },
        { new: true, session }
      );

      if (!updatedTransfer) {
        await session.abortTransaction();
        await session.endSession();
        return next(new CustomError(404, "Transfer not found"));
      }

      // If status changed to completed, update stock atomically
      if (status === "completed") {
        await updatedTransfer.updateStock(session);
        updatedTransfer.receivedDate = new Date();
        await updatedTransfer.save({ session });
      }

      await session.commitTransaction();
      await session.endSession();

      await populateTransferDetails(updatedTransfer);

      res.status(200).json({
        success: true,
        message: "Transfer status updated successfully",
        data: updatedTransfer,
      });
    } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      return next(
        new CustomError(
          500,
          `Failed to update transfer status: ${error.message}`
        )
      );
    }
  }
);

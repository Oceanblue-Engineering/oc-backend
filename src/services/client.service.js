import mongoose from "mongoose";
import Client from "../models/client.model.js";
import CreditPerson from "../models/creditPersona.model.js";
import AuditLog from "../models/auditLog.model.js";
import CustomError from "../utils/customError.js";

/**
 * Insert an audit trail entry for a client.
 */
export const createAudit = async ({ entityId, action, details, user, session }) => {
  return AuditLog.create(
    [
      {
        entityId,
        action,
        details: details || {},
        user: user || "system",
      },
    ],
    { session }
  );
};

/**
 * Ensure a POS Credit Person exists for the client.
 * Reuses the existing creditPersonId if already linked (idempotent — no duplicates).
 * Returns the creditPersonId (existing or newly created).
 */
export const ensureCreditPerson = async (client, session) => {
  // Already synced — skip
  if (client.creditPersonId) {
    return client.creditPersonId;
  }

  // Avoid duplicate by matching name + phone
  let existing = null;
  if (client.name) {
    const match = { name: client.name.trim() };
    if (client.phone) match.phone = client.phone;
    existing = await CreditPerson.findOne(match).session(session);
  }

  if (existing) {
    return existing._id;
  }

  const creditPerson = await CreditPerson.create(
    [
      {
        name: client.name || "Unnamed Client",
        phone: client.phone || "",
        address: client.companyName || client.businessName || null,
      },
    ],
    { session }
  );

  return creditPerson[0]._id;
};

/**
 * Update a client's status. If the new status is 'Signed', transition to
 * post-sale and auto-create a POS Credit Person atomically (single transaction).
 */
export const updateClientStatus = async (clientId, updateData, user = "system") => {
  const session = await mongoose.startSession();

  try {
    let updatedClient = null;

    await session.withTransaction(async () => {
      const client = await Client.findById(clientId).session(session);
      if (!client || client.isDeleted) {
        throw new CustomError(404, "Client not found");
      }

      // Detect status change for audit purposes
      const oldStatus = client.status;
      const newStatus =
        updateData.status !== undefined ? updateData.status : client.status;
      const statusChanged = oldStatus !== newStatus;

      // Apply allowed field updates
      const allowedFields = [
        "name",
        "phone",
        "address",
        "email",
        "companyName",
        "businessName",
        "industry",
        "leadType",
        "status",
        "inquiryDate",
        "sourceChannel",
        "currentProblems",
        "desiredOutcome",
        "nextActionDate",
        "conversationLogs",
        "projectId",
        "projectStartDate",
        "projectDeliveryDate",
        "deliverablesSummary",
        "purchasedServices",
      ];
      allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
          client[field] = updateData[field];
        }
      });

      // Validate nextActionDate required only for "Follow-up needed"
      if (
        client.status === "Follow-up needed" &&
        !client.nextActionDate
      ) {
        throw new CustomError(400, "nextActionDate is required when status is Follow-up needed");
      }

      // Lifecycle transition: Signed → post-sale + auto-create POS credit person
      if (client.status === "Signed") {
        client.isPostSale = true;
        if (!client.creditPersonId) {
          client.creditPersonId = await ensureCreditPerson(client, session);
        }
      }

      // Guard: once post-sale, don't silently revert (admin must do it explicitly)
      if (client.isPostSale && client.status !== "Signed") {
        client.isPostSale = true; // keep true; explicit revert handled separately
      }

      await client.save({ session });

      // Audit: log status change or generic update
      if (statusChanged) {
        await createAudit({
          entityId: client._id,
          action: "STATUS_CHANGE",
          details: { oldStatus, newStatus },
          user,
          session,
        });
      } else {
        await createAudit({
          entityId: client._id,
          action: "UPDATE",
          details: { fields: Object.keys(updateData) },
          user,
          session,
        });
      }

      updatedClient = client;
    });

    await session.endSession();
    return updatedClient;
  } catch (error) {
    await session.endSession();
    throw error;
  }
};

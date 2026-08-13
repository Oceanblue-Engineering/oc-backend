import mongoose from "mongoose";
import Client from "../models/client.model.js";
import Lead from "../models/lead.model.js";
import CreditPerson from "../models/creditPersona.model.js";
import AuditLog from "../models/auditLog.model.js";
import CustomError from "../utils/customError.js";

/**
 * Insert an audit trail entry for a lead or client.
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
 * Reuses the existing creditPersonId if already linked.
 */
export const ensureCreditPerson = async (client, session) => {
  if (client.creditPersonId) {
    return client.creditPersonId;
  }

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
 * Update a lead's status. If the status is changed to "Signed",
 * transition the lead to a Client record and create a POS Credit Person atomically.
 */
export const updateLeadStatusAndTransition = async (leadId, updateData, user = "system") => {
  const session = await mongoose.startSession();
  try {
    let result = { lead: null, client: null };

    await session.withTransaction(async () => {
      const lead = await Lead.findById(leadId).session(session);
      if (!lead || lead.isDeleted) {
        throw new CustomError(404, "Lead not found");
      }

      const oldStatus = lead.status;
      const newStatus = updateData.status !== undefined ? updateData.status : lead.status;
      const statusChanged = oldStatus !== newStatus;

      // Apply allowed lead fields
      const allowedLeadFields = [
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
      ];

      allowedLeadFields.forEach((field) => {
        if (updateData[field] !== undefined) {
          lead[field] = updateData[field];
        }
      });

      if (lead.status === "Follow-up needed" && !lead.nextActionDate) {
        throw new CustomError(400, "nextActionDate is required when status is Follow-up needed");
      }

      // Check transition to Client
      if (lead.status === "Signed") {
        lead.status = "Converted";
        lead.isDeleted = true;
        lead.deletedAt = new Date();

        // Create new Client
        const clientData = {
          name: lead.name,
          phone: lead.phone,
          address: lead.address,
          email: lead.email,
          companyName: lead.companyName,
          businessName: lead.businessName,
          industry: lead.industry,
          status: "Signed",
          leadId: lead._id,
        };

        const clientDocs = await Client.create([clientData], { session });
        const client = clientDocs[0];

        // Ensure POS Credit Person
        client.creditPersonId = await ensureCreditPerson(client, session);
        await client.save({ session });

        // Save the lead changes (Converted, isDeleted)
        await lead.save({ session });

        // Audit for conversion on lead
        await createAudit({
          entityId: lead._id,
          action: "STATUS_CHANGE",
          details: { oldStatus, newStatus: "Converted (Signed)" },
          user,
          session,
        });

        // Audit for creation on client
        await createAudit({
          entityId: client._id,
          action: "CREATE",
          details: { message: "Client created from Lead conversion", leadId: lead._id },
          user,
          session,
        });

        result.client = client;
      } else {
        await lead.save({ session });

        if (statusChanged) {
          await createAudit({
            entityId: lead._id,
            action: "STATUS_CHANGE",
            details: { oldStatus, newStatus },
            user,
            session,
          });
        } else {
          await createAudit({
            entityId: lead._id,
            action: "UPDATE",
            details: { fields: Object.keys(updateData) },
            user,
            session,
          });
        }
      }

      result.lead = lead;
    });

    await session.endSession();
    return result;
  } catch (error) {
    await session.endSession();
    throw error;
  }
};

/**
 * Update a client's status (Post-sale).
 */
export const updateClientStatus = async (clientId, updateData, user = "system") => {
  const client = await Client.findById(clientId);
  if (!client || client.isDeleted) {
    throw new CustomError(404, "Client not found");
  }

  const oldStatus = client.status;
  const newStatus = updateData.status !== undefined ? updateData.status : client.status;
  const statusChanged = oldStatus !== newStatus;

  const allowedClientFields = [
    "name",
    "phone",
    "address",
    "email",
    "companyName",
    "businessName",
    "industry",
    "status",
    "projectId",
    "projectStartDate",
    "projectDeliveryDate",
    "deliverablesSummary",
    "purchasedServices",
  ];

  allowedClientFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      client[field] = updateData[field];
    }
  });

  await client.save();

  if (statusChanged) {
    await createAudit({
      entityId: client._id,
      action: "STATUS_CHANGE",
      details: { oldStatus, newStatus },
      user,
    });
  } else {
    await createAudit({
      entityId: client._id,
      action: "UPDATE",
      details: { fields: Object.keys(updateData) },
      user,
    });
  }

  return client;
};

import TelegramBot from "node-telegram-bot-api";
import Ticket from "../models/ticket.model.js";
import TicketComment from "../models/ticketComment.model.js";
import Admin from "../models/admin.model.js";
import Department from "../models/department.model.js";
import { recordTicketHistory } from "./ticket.service.js";

let bot = null;

/**
 * Initialize the Telegram bot (polling in dev, webhook in production).
 * Returns null if no token is configured (notifications silently skip).
 */
export const initBot = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("[Telegram] No TELEGRAM_BOT_TOKEN — bot disabled.");
    return null;
  }

  const isProd = process.env.NODE_ENV === "production";
  bot = new TelegramBot(token, { polling: !isProd });

  if (isProd && process.env.TELEGRAM_WEBHOOK_URL) {
    bot
      .setWebHook(process.env.TELEGRAM_WEBHOOK_URL)
      .then(() => console.log("[Telegram] Webhook set."))
      .catch((err) => console.error("[Telegram] Webhook error:", err.message));
  }

  bot.on("callback_query", handleCallbackQuery);
  bot.on("message", handleReplyMessage);

  return bot;
};

export const getTelegramBot = () => bot;

const STATUSES = ["Open", "In Progress", "Pending", "Resolved"];

const STATUS_LABELS = {
  Open: "🟢 Open",
  "In Progress": "🟡 In Progress",
  Pending: "⏸ Pending",
  Resolved: "✅ Resolved",
};

// ── Helper to build status buttons ─────────────────────────
const buildStatusButtons = (ticketId, currentStatus) => [
  STATUSES.filter((s) => s !== currentStatus).map((s) => ({
    text: STATUS_LABELS[s] || s,
    callback_data: `ticket:${ticketId}:${s}`,
  })),
  [
    {
      text: "💬 Reply with Comment",
      callback_data: `ticket_comment_prompt:${ticketId}`,
    },
  ],
];

/**
 * Send a ticket-assignment notification to the assignee.
 * Skips silently if the assignee has no telegramChatId.
 */
export const notifyTicketAssigned = async (ticketId) => {
  if (!bot) return;
  const ticket = await Ticket.findById(ticketId)
    .populate("assigned_to", "name telegramChatId")
    .populate("created_by", "name")
    .populate("department_id", "name");

  const assignee = ticket?.assigned_to;
  if (!assignee?.telegramChatId) return;

  const msg =
    `*🎫 New Ticket Assigned*  \n\n` +
    `*Title:* ${ticket.title}  \n` +
    `*Priority:* ${ticket.priority}  \n` +
    `*Department:* ${ticket.department_id?.name || "—"}  \n` +
    `*Created by:* ${ticket.created_by?.name || "—"}  \n\n` +
    `_${ticket.description}_`;

  try {
    await bot.sendMessage(assignee.telegramChatId, msg, {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: buildStatusButtons(ticketId, ticket.status) },
    });
  } catch (err) {
    console.error("[Telegram] assign notify failed:", err.message);
  }
};

/**
 * Notify the ticket creator about a comment by the assignee (or vice-versa).
 */
export const notifyTicketComment = async ({ ticketId, commenterUserId }) => {
  if (!bot) return;
  const ticket = await Ticket.findById(ticketId)
    .populate("assigned_to", "telegramChatId name")
    .populate("created_by", "telegramChatId name");
  if (!ticket) return;

  const commenter =
    commenterUserId === String(ticket.created_by?._id) ? "creator" : "assignee";
  const recipient =
    commenter === "creator"
      ? ticket.assigned_to
      : ticket.created_by;
  const otherName = commenter === "creator" ? ticket.created_by?.name : ticket.assigned_to?.name;

  if (!recipient?.telegramChatId) return;

  try {
    await bot.sendMessage(
      recipient.telegramChatId,
      `*💬 New comment on #${ticketId}* by ${otherName || "User"}:\n\n_Check the ticket._`,
      { parse_mode: "Markdown", reply_markup: { inline_keyboard: buildStatusButtons(ticketId, ticket.status) } }
    );
  } catch (err) {
    console.error("[Telegram] comment notify failed:", err.message);
  }
};

// ── Callback handlers ──────────────────────────────────────
async function handleCallbackQuery(callbackQuery) {
  const { data, message } = callbackQuery;
  if (!data) return;

  const statusMatch = data.match(/^ticket:(.+):(Open|In Progress|Pending|Resolved)$/);
  if (statusMatch) {
    const [, ticketId, newStatus] = statusMatch;
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return;

    const prev = ticket.status;
    ticket.status = newStatus;
    await ticket.save();
    await recordTicketHistory(ticketId, ticket.assigned_to || ticket.created_by, `Changed status from ${prev} to ${newStatus}`);

    // Update the message's inline buttons to current status
    if (message?.message_id) {
      await bot.editMessageReplyMarkup(
        { inline_keyboard: buildStatusButtons(ticketId, newStatus) },
        { chat_id: message.chat.id, message_id: message.message_id }
      );
      await bot.editMessageText(
        `*🎫 Ticket #${ticketId}* status: *${newStatus}*  \n_${ticket.title}_`,
        { chat_id: message.chat.id, message_id: message.message_id, parse_mode: "Markdown" }
      );
    }

    // Notify the creator about the status change (if they have a chat linked and aren't the actor)
    const creator = await Admin.findById(ticket.created_by);
    const actingUser = callbackQuery.from?.id
      ? String(callbackQuery.from.id)
      : null;
    if (creator?.telegramChatId && creator.telegramChatId !== actingUser) {
      try {
        await bot.sendMessage(
          creator.telegramChatId,
          `*🎫 Ticket #${ticketId}* status changed to *${newStatus}*  \n_${ticket.title}_`,
          { parse_mode: "Markdown" }
        );
      } catch (err) {
        console.error("[Telegram] status notify failed:", err.message);
      }
    }
    return;
  }

  if (data.startsWith("ticket_comment_prompt:")) {
    const ticketId = data.split(":")[1];
    try {
      await bot.sendMessage(message.chat.id, `💬 Reply to this message with your comment for Ticket #${ticketId}:`, {
        reply_markup: { force_reply: true },
      });
    } catch (err) {
      console.error("[Telegram] reply prompt failed:", err.message);
    }
    return;
  }
}

async function handleReplyMessage(msg) {
  // Only process replies to our ForceReply prompt
  const reply = msg.reply_to_message;
  if (!reply || !msg.text) return;

  const match = (reply.text || "").match(/Ticket #(\w+)/);
  const ticketId = match ? match[1] : null;
  if (!ticketId) return;

  // Find admin by telegram chat id
  const admin = await Admin.findOne({ telegramChatId: String(msg.chat.id) });
  if (!admin) return;

  const user_id = admin._id;
  await TicketComment.create({ ticket_id: ticketId, user_id, message: msg.text });
  await recordTicketHistory(ticketId, user_id, "Added a comment");
  await notifyTicketComment({ ticketId, commenterUserId: String(user_id) });
}

export default { initBot, getTelegramBot, notifyTicketAssigned, notifyTicketComment };
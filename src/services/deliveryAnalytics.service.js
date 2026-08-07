import Order from "../models/orders.model.js";

/**
 * Delivery analytics derived from delivery orders.
 * Returns totals, per-township breakdown, and per-status breakdown.
 */
export const getDeliveryAnalytics = async () => {
  // Only orders that actually used delivery (township selected)
  const deliveryFilter = {
    isDeleted: false,
    "deliveryDetails.township": { $exists: true, $ne: null },
  };

  // ── Totals ──────────────────────────────────────────
  const [totals] = await Order.aggregate([
    { $match: deliveryFilter },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$deliveryDetails.deliveryFee" },
      },
    },
  ]);

  // ── By township ─────────────────────────────────────
  const byTownship = await Order.aggregate([
    { $match: deliveryFilter },
    {
      $group: {
        _id: "$deliveryDetails.townshipName",
        orders: { $sum: 1 },
        revenue: { $sum: "$deliveryDetails.deliveryFee" },
      },
    },
    { $sort: { orders: -1 } },
  ]);

  // ── By delivery status ──────────────────────────────
  const byStatus = await Order.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: "$deliveryStatus", count: { $sum: 1 } } },
  ]);

  const statusMap = {};
  byStatus.forEach((s) => {
    statusMap[s._id || "pending"] = s.count;
  });

  return {
    totals: {
      totalOrders: totals?.totalOrders || 0,
      totalRevenue: totals?.totalRevenue || 0,
    },
    byTownship: byTownship.map((t) => ({
      townshipName: t._id || "Unnamed",
      orders: t.orders,
      revenue: t.revenue || 0,
    })),
    byStatus: statusMap,
  };
};

import { asyncErrorHandler } from "../utils/asyncErrorHandler.js";
import { getDeliveryAnalytics } from "../services/deliveryAnalytics.service.js";

// GET — delivery analytics (totals, by township, by status)
export const getDeliveryAnalyticsController = asyncErrorHandler(
  async (req, res, next) => {
    const analytics = await getDeliveryAnalytics();

    res.status(200).json({
      success: true,
      message: "Delivery analytics fetched successfully",
      data: analytics,
    });
  }
);

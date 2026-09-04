import ActivityLog from "../models/activityLog.model.js";
import Admin from "../models/admin.model.js";
import jwt from "jsonwebtoken";

// Sensitive field keys to scrub from logged request body
const SENSITIVE_KEYS = new Set([
  "password",
  "currentpassword",
  "newpassword",
  "confirmpassword",
  "token",
  "secret",
  "accesstoken",
  "refreshtoken",
  "jwt",
  "auth",
  "pin",
  "cardnumber",
  "cvv",
]);

/**
 * Deeply clone and sanitize an object to remove sensitive information.
 */
function sanitizePayload(obj, depth = 0) {
  if (depth > 5 || !obj) return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    if (obj.length > 50) {
      return `[Array with ${obj.length} items]`;
    }
    return obj.map((item) => sanitizePayload(item, depth + 1));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizePayload(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Map route path & HTTP method to user-friendly module name and action description.
 */
function resolveModuleAndAction(method, path) {
  const cleanPath = (path || "").toLowerCase();

  // Route matches
  if (cleanPath.includes("/order")) {
    if (method === "POST") return { module: "Orders", action: "Create Order" };
    if (method === "DELETE") return { module: "Orders", action: "Delete / Cancel Order" };
    return { module: "Orders", action: "Update Order" };
  }
  if (cleanPath.includes("/credit-record") || cleanPath.includes("/credit-persona") || cleanPath.includes("/credits")) {
    if (cleanPath.includes("/credit-record") && method === "POST") return { module: "Credits", action: "Record Credit Payment" };
    if (cleanPath.includes("/credit-persona") && method === "POST") return { module: "Credits", action: "Create Credit Person" };
    if (cleanPath.includes("/blacklist") || cleanPath.includes("/status")) return { module: "Credits", action: "Toggle Customer Blacklist" };
    if (method === "DELETE") return { module: "Credits", action: "Delete Credit Record / Persona" };
    return { module: "Credits", action: "Update Credit Details" };
  }
  if (cleanPath.includes("/inventory") || cleanPath.includes("/storefront-inventory")) {
    if (method === "POST") return { module: "Inventory", action: "Add Product / Inventory" };
    if (method === "DELETE") return { module: "Inventory", action: "Delete Product" };
    return { module: "Inventory", action: "Update Product / Stock" };
  }
  if (cleanPath.includes("/purchasing") || cleanPath.includes("/po")) {
    if (method === "POST") return { module: "Purchasing", action: "Create Purchase Order" };
    if (method === "DELETE") return { module: "Purchasing", action: "Delete Purchase Order" };
    return { module: "Purchasing", action: "Update Purchase Order" };
  }
  if (cleanPath.includes("/grn")) {
    if (method === "POST") return { module: "Warehouse", action: "Create Goods Received Note (GRN)" };
    return { module: "Warehouse", action: "Update GRN" };
  }
  if (cleanPath.includes("/transfer")) {
    if (method === "POST") return { module: "Warehouse", action: "Stock Transfer" };
    return { module: "Warehouse", action: "Update Transfer" };
  }
  if (cleanPath.includes("/warehouse")) {
    if (method === "POST") return { module: "Warehouse", action: "Create Warehouse Profile" };
    if (method === "DELETE") return { module: "Warehouse", action: "Delete Warehouse Profile" };
    return { module: "Warehouse", action: "Update Warehouse Profile" };
  }
  if (cleanPath.includes("/storefront")) {
    if (method === "POST") return { module: "Storefront", action: "Create Storefront Profile" };
    if (method === "DELETE") return { module: "Storefront", action: "Delete Storefront Profile" };
    return { module: "Storefront", action: "Update Storefront Profile" };
  }
  if (cleanPath.includes("/expense")) {
    if (method === "POST") return { module: "Expenses", action: "Record Expense" };
    if (method === "DELETE") return { module: "Expenses", action: "Delete Expense" };
    return { module: "Expenses", action: "Update Expense" };
  }
  if (cleanPath.includes("/client")) {
    if (method === "POST") return { module: "Clients", action: "Create Client" };
    if (method === "DELETE") return { module: "Clients", action: "Delete Client" };
    return { module: "Clients", action: "Update Client" };
  }
  if (cleanPath.includes("/lead")) {
    if (method === "POST") return { module: "Leads", action: "Create Lead" };
    if (method === "DELETE") return { module: "Leads", action: "Delete Lead" };
    return { module: "Leads", action: "Update Lead" };
  }
  if (cleanPath.includes("/project")) {
    if (method === "POST") return { module: "Projects", action: "Create Project" };
    if (method === "DELETE") return { module: "Projects", action: "Delete Project" };
    return { module: "Projects", action: "Update Project" };
  }
  if (cleanPath.includes("/ticket")) {
    if (method === "POST") return { module: "Tickets", action: "Create Support Ticket / Comment" };
    if (method === "DELETE") return { module: "Tickets", action: "Delete Ticket" };
    return { module: "Tickets", action: "Update Ticket Status" };
  }
  if (cleanPath.includes("/workers") || cleanPath.includes("/worker")) {
    if (method === "POST") return { module: "Workers", action: "Add Worker" };
    if (method === "DELETE") return { module: "Workers", action: "Delete Worker" };
    return { module: "Workers", action: "Update Worker" };
  }
  if (cleanPath.includes("/attendance")) {
    return { module: "Attendance", action: "Record Worker Attendance" };
  }
  if (cleanPath.includes("/invoice")) {
    if (method === "POST") return { module: "Invoice", action: "Create Invoice" };
    return { module: "Invoice", action: "Update Invoice" };
  }
  if (cleanPath.includes("/supplier")) {
    if (method === "POST") return { module: "Suppliers", action: "Add Supplier Profile" };
    if (method === "DELETE") return { module: "Suppliers", action: "Delete Supplier" };
    return { module: "Suppliers", action: "Update Supplier" };
  }
  if (cleanPath.includes("/township") || cleanPath.includes("/delivery")) {
    if (method === "POST") return { module: "Delivery", action: "Add Delivery Township" };
    if (method === "DELETE") return { module: "Delivery", action: "Delete Delivery Township" };
    return { module: "Delivery", action: "Update Delivery Township" };
  }
  if (cleanPath.includes("/admin") || cleanPath.includes("/auth") || cleanPath.includes("/user")) {
    if (cleanPath.includes("/login")) return { module: "Auth", action: "User Login" };
    if (cleanPath.includes("/register") || (cleanPath.includes("/admin") && method === "POST")) return { module: "Auth", action: "Create Admin Account" };
    if (method === "DELETE") return { module: "Auth", action: "Delete Admin Account" };
    return { module: "Auth", action: "Update Admin Account / Role" };
  }
  if (cleanPath.includes("/shop-setting") || cleanPath.includes("/setting")) {
    return { module: "Settings", action: "Update Shop Settings" };
  }
  if (cleanPath.includes("/lucky-draw")) {
    return { module: "Lucky Draw", action: "Manage Lucky Draw" };
  }

  // Fallback
  const segment = cleanPath.replace(/^\/api(\/v\d+)?\//, "").split("/")[0] || "General";
  const formattedModule = segment.charAt(0).toUpperCase() + segment.slice(1);
  return {
    module: formattedModule,
    action: `${method} ${segment}`,
  };
}

/**
 * Global Activity Logger Express Middleware.
 * Only logs mutating HTTP methods (POST, PUT, PATCH, DELETE).
 */
export const activityLoggerMiddleware = async (req, res, next) => {
  const mutatingMethods = ["POST", "PUT", "PATCH", "DELETE"];
  
  // Skip non-mutating requests (GET, OPTIONS, HEAD)
  if (!mutatingMethods.includes(req.method)) {
    return next();
  }

  // Skip self activity-logs endpoints to prevent recursive loop, and skip telegram webhook
  const originalUrl = req.originalUrl || req.url || "";
  if (
    originalUrl.includes("/activity-logs") ||
    originalUrl.includes("/webhook/telegram")
  ) {
    return next();
  }

  const startTime = Date.now();

  // Capture user info early if available or from Authorization header
  let userSnapshot = {
    _id: null,
    name: "System / Anonymous",
    email: "",
    role: "unknown",
  };

  // Intercept response finish event to capture final status code & duration
  res.on("finish", async () => {
    try {
      const durationMs = Date.now() - startTime;
      const statusCode = res.statusCode;
      const status = statusCode < 400 ? "SUCCESS" : "FAILED";

      // 1. Resolve User
      if (req.user) {
        userSnapshot = {
          _id: req.user._id || null,
          name: req.user.name || "Admin User",
          email: req.user.email || "",
          role: req.user.role || "unknown",
        };
      } else if (req.headers.authorization?.startsWith("Bearer ")) {
        try {
          const token = req.headers.authorization.split(" ")[1];
          const decoded = jwt.decode(token);
          if (decoded && decoded.id) {
            const admin = await Admin.findById(decoded.id).select("name email role").lean();
            if (admin) {
              userSnapshot = {
                _id: admin._id,
                name: admin.name,
                email: admin.email || "",
                role: admin.role || decoded.role || "unknown",
              };
            }
          }
        } catch (_) {}
      }

      // If login request, extract email from body for user info
      if (originalUrl.includes("/login") && req.body?.email) {
        userSnapshot.email = req.body.email;
        userSnapshot.name = userSnapshot.name === "System / Anonymous" ? req.body.email : userSnapshot.name;
      }

      // 2. Resolve Module & Action
      const { module, action } = resolveModuleAndAction(req.method, originalUrl);

      // 3. Sanitize Request Body
      const sanitizedBody = sanitizePayload(req.body);

      // 4. Client IP & User Agent
      const ipAddress =
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        "";
      const userAgent = req.headers["user-agent"] || "";

      // 5. Asynchronously persist ActivityLog (fire and forget)
      await ActivityLog.create({
        user: userSnapshot,
        method: req.method,
        endpoint: originalUrl,
        module,
        action,
        statusCode,
        status,
        requestBody: sanitizedBody,
        requestParams: Object.keys(req.params || {}).length ? req.params : null,
        requestQuery: Object.keys(req.query || {}).length ? req.query : null,
        errorMessage: status === "FAILED" ? res.statusMessage || null : null,
        ipAddress,
        userAgent,
        durationMs,
      });
    } catch (err) {
      console.error("Error creating activity log:", err.message);
    }
  });

  next();
};

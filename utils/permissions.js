const PERMISSIONS = {
  // Stock & Inventory
  CAN_ADD_STOCK: "can_add_stock",
  CAN_EDIT_STOCK: "can_edit_stock",
  CAN_DELETE_STOCK: "can_delete_stock",
  CAN_MANAGE_STOCK_ALERTS: "can_manage_stock_alerts",

  // Folder & Organization
  CAN_MANAGE_FOLDERS: "can_manage_folders",

  // Sales & Orders
  CAN_RECORD_SALES: "can_record_sales",
  CAN_VIEW_ORDERS: "can_view_orders",

  // Team & Organization
  CAN_INVITE_TEAM: "can_invite_team",
  CAN_REMOVE_TEAM: "can_remove_team",
  CAN_MANAGE_ROLES: "can_manage_roles",
  CAN_EDIT_ORG_SETTINGS: "can_edit_org_settings",

  // Charts & Reports
  CAN_VIEW_CHARTS: "can_view_charts",
  CAN_EXPORT_REPORTS: "can_export_reports",

  // Logs & Audit
  CAN_VIEW_ACTIVITY_LOGS: "can_view_activity_logs",

  // Automations & Integrations
  CAN_MANAGE_AUTOMATIONS: "can_manage_automations",
  CAN_MANAGE_INTEGRATIONS: "can_manage_integrations",

  // Customers
  CAN_MANAGE_CUSTOMERS: "can_manage_customers",

  // Products Categories
  CAN_MANAGE_CATEGORIES: "can_manage_categories",
};

module.exports = { PERMISSIONS };

// Fuente única de RBAC. La API, el seed y el panel leen de aquí.
// Mantiene la matriz de la especificación (sección 3) en un solo lugar.

export const PERMISSIONS = {
  USER_MANAGE: "user.manage",
  BRANCH_MANAGE: "branch.manage",
  SUPPLIER_MANAGE: "supplier.manage",
  PRODUCT_MANAGE: "product.manage",
  MAESTRO_MANAGE: "maestro.manage",
  RECEPTION_CREATE: "reception.create",
  RECEPTION_ASSIGN: "reception.assign",
  RECEPTION_SCAN: "reception.scan",
  RECEPTION_VIEW: "reception.view",
  REPORT_VIEW: "report.view",
  REPORT_EXPORT: "report.export",
  DASHBOARD_VIEW: "dashboard.view",
  AUDIT_VIEW: "audit.view",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  QF_ADMIN: "QF_ADMIN",
  SUPERVISOR: "SUPERVISOR",
  OPERADOR: "OPERADOR",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

const P = PERMISSIONS;

// Matriz rol -> permisos (idéntica a la de la especificación).
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.QF_ADMIN]: [
    P.SUPPLIER_MANAGE,
    P.PRODUCT_MANAGE,
    P.MAESTRO_MANAGE,
    P.RECEPTION_CREATE,
    P.RECEPTION_ASSIGN,
    P.RECEPTION_SCAN,
    P.RECEPTION_VIEW,
    P.REPORT_VIEW,
    P.REPORT_EXPORT,
    P.DASHBOARD_VIEW,
    P.AUDIT_VIEW,
  ],
  [ROLES.SUPERVISOR]: [
    P.RECEPTION_VIEW,
    P.REPORT_VIEW,
    P.REPORT_EXPORT,
    P.DASHBOARD_VIEW,
  ],
  [ROLES.OPERADOR]: [P.RECEPTION_SCAN, P.RECEPTION_VIEW],
};

// Roles globales: ignoran el filtro de ámbito de local.
export const GLOBAL_ROLES: Role[] = [ROLES.SUPER_ADMIN];

export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  [P.USER_MANAGE]: "Administrar usuarios",
  [P.BRANCH_MANAGE]: "Administrar locales",
  [P.SUPPLIER_MANAGE]: "Administrar proveedores",
  [P.PRODUCT_MANAGE]: "Administrar productos",
  [P.MAESTRO_MANAGE]: "Administrar el MAESTRO de SKU",
  [P.RECEPTION_CREATE]: "Crear recepciones",
  [P.RECEPTION_ASSIGN]: "Asignar recepciones",
  [P.RECEPTION_SCAN]: "Operar/escanear recepciones",
  [P.RECEPTION_VIEW]: "Ver recepciones",
  [P.REPORT_VIEW]: "Ver reportes",
  [P.REPORT_EXPORT]: "Exportar reportes",
  [P.DASHBOARD_VIEW]: "Ver dashboard",
  [P.AUDIT_VIEW]: "Ver auditoría",
};

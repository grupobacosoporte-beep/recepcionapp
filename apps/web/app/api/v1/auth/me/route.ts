import { db } from "@/lib/db";
import { json, withAuth } from "@/lib/http";

export const GET = withAuth(async (_req, ctx) => {
  const branches = ctx.isGlobal
    ? await db.branch.findMany({ where: { active: true } })
    : await db.branch.findMany({ where: { id: { in: ctx.branchIds }, active: true } });
  return json({
    id: ctx.userId,
    email: ctx.email,
    roles: ctx.roles,
    permissions: ctx.permissions,
    branches: branches.map((b) => ({ id: b.id, code: b.code, name: b.name, active: b.active })),
  });
});

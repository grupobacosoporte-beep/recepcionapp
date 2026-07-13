// Seed de Fase 0: crea permisos, roles, la matriz rol-permiso y el local piloto.
// Ejecutar: pnpm prisma db seed
import { PrismaClient } from "@prisma/client";
import {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  PERMISSION_DESCRIPTIONS,
  Role,
} from "../lib/auth/permissions";

const prisma = new PrismaClient();

async function main() {
  // Permisos
  for (const key of Object.values(PERMISSIONS)) {
    await prisma.permission.upsert({
      where: { key },
      update: { description: PERMISSION_DESCRIPTIONS[key] },
      create: { key, description: PERMISSION_DESCRIPTIONS[key] },
    });
  }

  // Roles + asignación de permisos según la matriz
  for (const roleKey of Object.values(ROLES) as Role[]) {
    const role = await prisma.role.upsert({
      where: { key: roleKey },
      update: { name: roleKey },
      create: { key: roleKey, name: roleKey },
    });

    const perms = await prisma.permission.findMany({
      where: { key: { in: ROLE_PERMISSIONS[roleKey] } },
    });

    // Reasigna la matriz (idempotente)
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
      skipDuplicates: true,
    });
  }

  // Local piloto
  await prisma.branch.upsert({
    where: { code: "PILOTO" },
    update: {},
    create: { code: "PILOTO", name: "Local Piloto" },
  });

  console.log("Seed completo: permisos, roles, matriz y local piloto.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

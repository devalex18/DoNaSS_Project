require('dotenv').config();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ROLES = {
  ADMIN: 'administrador',
  EMPLOYEE: 'empleado',
};

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Administrador';

  if (!email || !password) {
    throw new Error('Faltan ADMIN_EMAIL o ADMIN_PASSWORD en el archivo .env');
  }

  const bcryptRounds = Number(process.env.BCRYPT_ROUNDS ?? 10);
  const passwordHash = await bcrypt.hash(password, bcryptRounds);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name,
      email,
      passwordHash,
      role: ROLES.ADMIN,
      isActive: true,
      mustChangePassword: false,
    },
  });

  console.log(`Usuario administrador listo: ${admin.email} (id: ${admin.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
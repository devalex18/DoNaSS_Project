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
  const name = process.env.ADMIN_NAME;

  if (!email || !password || !name) {
    throw new Error('Faltan ADMIN_EMAIL, ADMIN_PASSWORD o ADMIN_NAME en el archivo .env');
  }

  const bcryptRounds = Number(process.env.BCRYPT_ROUNDS);
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
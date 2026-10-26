require('dotenv').config();
const bcrypt = require('bcrypt');
const prisma = require('../src/config/db');
const { ROLES, SECURITY } = require('../src/config/constants');

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Administrador';

  if (!email || !password) {
    throw new Error('Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env');
  }

  const passwordHash = await bcrypt.hash(password, SECURITY.BCRYPT_ROUNDS);

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

  console.log(`Admin ready: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
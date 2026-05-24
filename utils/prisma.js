// File ini untuk inisiasi client prisma dengan export ke semua file yang membutuhkan prisma. 
// Supaya tidak perlu import ulang di setiap file.
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { PrismaPg } from '@prisma/adapter-pg';

// Buat adapter PostgreSQL menggunakan URL database
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

// Inisialisasi Prisma Client dengan menyertakan adapter
const prisma = new PrismaClient({ adapter });

// Export client agar bisa digunakan di file lain
export default prisma;
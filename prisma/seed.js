import bcrypt from 'bcrypt';
import prisma from '../utils/prisma.js';

async function main() {
  console.log('🌱 Memulai proses seeding database...');

  // 1. Hash password yang akan dipakai oleh user dummy
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  // 2. Definisikan data user dummy dalam bentuk Array agar mudah ditambahkan
  const dummyUsers = [
    {
      fullname: 'John Doe',
      username: 'johndoe',
      email: 'john.doe@example.com',
      password: hashedPassword,
      is_verified: true,
      bio: 'Seorang penikmat senja dan kopi ☕',
    },
    {
      fullname: 'Jane Smith',
      username: 'janesmith',
      email: 'jane.smith@example.com',
      password: hashedPassword,
      is_verified: true,
      bio: 'Suka membagikan foto-foto kucing 🐱',
    },
    {
      fullname: 'Michael Jordan',
      username: 'michealj',
      email: 'michael.jordan@example.com',
      password: hashedPassword,
      is_verified: true,
      bio: 'Basketball is my life. 🏀',
    },
    {
      fullname: 'Sarah Connor',
      username: 'sconnor',
      email: 'sarah.connor@example.com',
      password: hashedPassword,
      is_verified: true,
      bio: 'No fate but what we make.',
    },
    {
      fullname: 'David Beckham',
      username: 'dbeckham',
      email: 'david.beckham@example.com',
      password: hashedPassword,
      is_verified: true,
      bio: 'Free kick specialist. ⚽',
    },
    {
      fullname: 'Emma Watson',
      username: 'emawatson',
      email: 'emma.watson@example.com',
      password: hashedPassword,
      is_verified: true,
      bio: 'Actress and UN Women Goodwill Ambassador. ✨',
    },
    {
      fullname: 'Chris Evans',
      username: 'chrisevans',
      email: 'chris.evans@example.com',
      password: hashedPassword,
      is_verified: true,
      bio: 'I can do this all day. 🛡️',
    },
    {
      fullname: 'Taylor Swift',
      username: 'taylorswift',
      email: 'taylor.swift@example.com',
      password: hashedPassword,
      is_verified: true,
      bio: 'Welcome to the Eras Tour! 🎤🎸',
    },
  ];

  // 3. Masukkan data ke database menggunakan loop
  const seededUsers = [];
  for (const user of dummyUsers) {
    const seededUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {}, // Jangan timpa datanya jika sudah ada
      create: user,
    });
    seededUsers.push(seededUser);
  }

  console.log(`✅ Seeding berhasil! Berhasil memproses ${seededUsers.length} user.`);
  console.log(seededUsers);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Terjadi kesalahan saat seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

# 1. Gunakan image Node.js yang ringan (Alpine)
FROM node:20-alpine

# 2. Tentukan direktori kerja di dalam container
WORKDIR /app

# 3. Copy package.json dan package-lock.json terlebih dahulu (untuk optimasi cache Docker)
COPY package*.json ./

# 4. Copy folder prisma (dibutuhkan untuk generate client)
COPY prisma ./prisma/

# 5. Install semua dependencies
RUN npm install

# 6. Generate Prisma Client agar bisa berkomunikasi dengan database
RUN npx prisma generate

# 7. Copy seluruh sisa file project ke dalam container
COPY . .

# 8. Beritahu Docker bahwa container ini akan listen di port 8080 (standar Cloud Run)
EXPOSE 8080

# 9. Jalankan aplikasi menggunakan Node.js (bukan nodemon untuk production)
CMD ["node", "server.js"]

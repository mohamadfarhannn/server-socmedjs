import z from "zod";
import prisma from "../utils/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail.js";

export const RegisterController = async (req, res) => {
  try {
    // 1. Validation Schema
    const userSchema = z.object({
      fullname: z.string().min(3, "Fullname minimal 3 karakter").max(100, "Fullname maksimal 100 karakter"),
      username: z.string().min(3, "Username minimal 3 karakter").max(100, "Username maksimal 100 karakter"),
      email: z.string().email("Format email tidak valid. contoh: example@mail.com").max(100, "Email maksimal 100 karakter"),
      password: z.string().min(6, "Password minimal 6 karakter").max(100),
    });

    // 2. Lakukan validasi. Jika gagal, Zod akan melempar ZodError ke blok catch.
    const validatedData = userSchema.parse(req.body);

    // 3. Pengecekan apakah email sudah terdaftar
    const emailExisting = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });
    if (emailExisting) {
      return res.status(400).json({
        message: "Email sudah terdaftar, gunakan email lain",
      });
    }

    // 4. Pengecekan apakah username sudah terdaftar
    const usernameExisting = await prisma.user.findUnique({
      where: { username: validatedData.username },
    });
    if (usernameExisting) {
      return res.status(400).json({
        message: "Username sudah terdaftar, gunakan username lain",
      });
    }

    // 5. Enkripsi password menggunakan bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validatedData.password, salt);

    // 6. Buat user baru di database
    const newUser = await prisma.user.create({
      data: {
        fullname: validatedData.fullname,
        username: validatedData.username,
        email: validatedData.email,
        password: hashedPassword,
      },
    });

    // 7. Generate OTP dan simpan ke database
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit random
    const hashedOtp = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 menit dari sekarang

    await prisma.otpVerivication.create({
      data: {
        userId: newUser.id,
        otp_code: hashedOtp,
        expires_at: expiresAt,
      },
    });

    // 8. Kirim email OTP
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Verifikasi Email Anda</h2>
        <p>Halo <strong>${newUser.fullname}</strong>,</p>
        <p>Terima kasih telah mendaftar di aplikasi kami. Berikut adalah kode OTP Anda untuk mengaktifkan akun:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; background: #f4f4f4; padding: 15px 25px; border-radius: 8px; letter-spacing: 5px; color: #111;">
            ${otpCode}
          </span>
        </div>
        <p>Kode ini hanya berlaku selama <strong>15 menit</strong>. Jangan bagikan kode ini kepada siapa pun.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #888; text-align: center;">Jika Anda tidak merasa mendaftar di aplikasi ini, abaikan saja email ini.</p>
      </div>
    `;
    
    await sendEmail({
      to: newUser.email,
      subject: "Kode Verifikasi OTP - DailyGrind",
      html: emailHtml,
    });

    // 9. Kirim respons sukses
    return res.status(201).json({
      message: "Registrasi berhasil, silakan periksa email Anda untuk memasukkan kode verifikasi.",
      data: {
        id: newUser.id,
        email: newUser.email,
      },
    });
  } catch (err) {
    // Catch Zod validation errors
    if (err instanceof z.ZodError) {
      const errors = err.issues.map((i) => i.message);
      console.log("Validation Errors:", errors);
      return res.status(400).json({
        message: errors,
      });
    }

    // Express
    // Catch database or other general errors
    console.error("Server Error:", err);
    return res.status(500).json({
      message: "Server Error!",
      error: err.message,
    });
  }
};

export const LoginController = async (req, res) => {
  try {
    //  Validasi email dan password
    const { email, username, password } = req.body;

    const identifier = email || username;

    // pengecekan email atau password kosong
    if (!identifier || !password) {
      return res.status(400).json({
        message: "Email atau username dan password wajib diisi",
      });
    }

    // pengecekan email atau username apakah ada di database
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        message: "Email atau username belum terdaftar, silahkan register terlebih dahulu",
      });
    }

    // Pengecekan apakah user sudah verifikasi OTP, kalo belum gabisa login
    if (!existingUser.is_verified) {
      return res.status(403).json({
        message: "Harap verifikasi email Anda terlebih dahulu!",
      });
    }

    const comparePassword = bcrypt.compareSync(password, existingUser.password);
    if (!comparePassword) {
      return res.status(401).json({
        message: "Password salah, silahkan periksa kembali",
      });
    }

    // buat jwt dan simpan id user ke jwt
    const jwtSecret = process.env.JWT_SECRET;
    const token = jwt.sign({ id: existingUser.id }, jwtSecret, { expiresIn: "6d" });

    // response login
    return res.status(201).json({
      message: "Login success",
      data: {
        id: existingUser.id,
        fullname: existingUser.fullname,
        username: existingUser.username,
        email: existingUser.email,
        image: existingUser.image,
        bio: existingUser.bio,
      },
      token: token,
    });
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({
      message: "Server Error!",
      error: error.message,
    });
  }
};

export const GetUser = async (req, res) => {
  res.status(200).json({
    message: "Get user success",
    data: req.user,
  });
};

// Verifikasi OTP (auth/verify-email)
export const VerifyOTPController = async (req, res) => {
  try {
    const { email, otp_code } = req.body;

    if (!email || !otp_code) {
      return res.status(400).json({ message: "Email dan kode OTP wajib diisi" });
    }

    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    if (user.is_verified) {
      return res.status(400).json({ message: "Akun sudah diverifikasi sebelumnya" });
    }

    // Cari OTP berdasarkan userId
    const otpRecord = await prisma.otpVerivication.findUnique({
      where: { userId: user.id },
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "Kode OTP tidak ditemukan atau sudah hangus" });
    }

    // Cek apakah expired
    if (new Date() > otpRecord.expires_at) {
      // Hapus OTP yang sudah expired
      await prisma.otpVerivication.delete({ where: { userId: user.id } });
      return res.status(400).json({ message: "Kode OTP sudah kedaluwarsa. Silakan minta kode baru." });
    }

    // Validasi kode OTP
    const isValidOtp = await bcrypt.compare(otp_code, otpRecord.otp_code);
    if (!isValidOtp) {
      return res.status(400).json({ message: "Kode OTP salah" });
    }

    // Jika valid: Ubah status is_verified dan hapus record OTP
    await prisma.user.update({
      where: { id: user.id },
      data: { is_verified: true },
    });

    await prisma.otpVerivication.delete({ where: { userId: user.id } });

    // Buatkan token JWT (agar user bisa langsung login di frontend)
    const jwtSecret = process.env.JWT_SECRET;
    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: "6d" });

    return res.status(200).json({
      message: "Verifikasi email berhasil!",
      data: {
        id: user.id,
        fullname: user.fullname,
        username: user.username,
        email: user.email,
        image: user.image,
        bio: user.bio,
      },
      token: token,
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({
      message: "Server Error!",
      error: error.message,
    });
  }
};

export const ResendOTPController = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email wajib diisi" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    if (user.is_verified) {
      return res.status(400).json({ message: "Akun sudah diverifikasi, tidak perlu OTP lagi." });
    }

    // Hapus OTP lama jika masih ada
    const existingOtp = await prisma.otpVerivication.findUnique({ where: { userId: user.id } });
    if (existingOtp) {
      await prisma.otpVerivication.delete({ where: { userId: user.id } });
    }

    // Generate OTP baru
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.otpVerivication.create({
      data: {
        userId: user.id,
        otp_code: hashedOtp,
        expires_at: expiresAt,
      },
    });

    // Kirim email
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Kirim Ulang Kode Verifikasi</h2>
        <p>Halo <strong>${user.fullname}</strong>,</p>
        <p>Anda meminta untuk mengirim ulang kode OTP. Berikut adalah kode OTP baru Anda:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; background: #f4f4f4; padding: 15px 25px; border-radius: 8px; letter-spacing: 5px; color: #111;">
            ${otpCode}
          </span>
        </div>
        <p>Kode ini hanya berlaku selama <strong>15 menit</strong>.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #888; text-align: center;">Jika Anda tidak merasa meminta ini, abaikan saja email ini.</p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: "Kirim Ulang OTP - DailyGrind",
      html: emailHtml,
    });

    return res.status(200).json({ message: "Kode OTP baru telah dikirim ke email Anda." });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    return res.status(500).json({
      message: "Server Error!",
      error: error.message,
    });
  }
};

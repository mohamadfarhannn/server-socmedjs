import z from "zod";
import prisma from "../utils/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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

    const jwtSecret = process.env.JWT_SECRET;
    const token = jwt.sign({ id: newUser.id }, jwtSecret, { expiresIn: "6d" });

    // 7. Kirim respons sukses
    return res.status(201).json({
      message: "Register success",
      data: {
        id: newUser.id,
        fullname: newUser.fullname,
        username: newUser.username,
        email: newUser.email,
        image: newUser.image,
        bio: newUser.bio,
      },
      token: token,
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

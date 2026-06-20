import z from "zod";
import prisma from "../utils/prisma.js";
import cloudinary from "../utils/cloudinary.js";

export const GetUserInfo = async (req, res) => {
  const { username } = req.params
  const currentUserId = req.user.id
  
  try {
    // Hanya ambil data profil dan cek apakah kita follow user ini
    const user = await prisma.user.findUnique({
      where: {
        username: username,
      }, 
      omit: {
        password: true,
        imageId: true,
      },
      include: {
        followers: {
          where: { followerId: currentUserId },
          select: { followerId: true }
        }
      }
    })

    if(!user) {
      return res.status(404).json({
        message: "User not found"
      })
    }

    const { followers, ...userData } = user;
    const isFollowedByMe = followers.length > 0;

    return res.status(200).json({
      message: "Get detail user success",
      data: {
        ...userData,
        isFollowedByMe
      },
    })
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({
      message: "Server Error!",
      error: error.message,
    })
  }
}

export const GetUserPosts = async (req, res) => {
  try {
    const { username } = req.params
    const currentUserId = req.user.id
    
    let pageNumber = req.query.page ? Number(req.query.page) : 1;
    let limitNumber = req.query.limit ? Number(req.query.limit) : 10;
    if (limitNumber > 20) limitNumber = 20;
    const skip = (pageNumber - 1) * limitNumber

    // Cari ID dari username target
    const targetUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    })

    if (!targetUser) return res.status(404).json({ message: "User not found" });

    const [totalPosts, posts] = await Promise.all([
      prisma.post.count({ where: { userId: targetUser.id } }),
      prisma.post.findMany({
        where: { userId: targetUser.id },
        include: {
          user: { select: { id: true, username: true, fullname: true, image: true } },
          likes: { where: { userId: currentUserId }, select: { userId: true } },
          bookmarks: { where: { userId: currentUserId }, select: { userId: true } }
        },
        orderBy: { createdAt: "desc" },
        take: limitNumber,
        skip,
      })
    ])

    const formattedPosts = posts.map(post => {
      const { likes, bookmarks, ...postData } = post;
      return {
        ...postData,
        isLikedByMe: likes.length > 0,
        isBookmarkedByMe: bookmarks.length > 0,
      }
    })

    return res.status(200).json({
      success: true,
      pagination: {
        current_page: pageNumber,
        total_pages: Math.ceil(totalPosts / limitNumber),
        total_items: totalPosts,
        limit_per_page: limitNumber,
      },
      data: formattedPosts,
    })
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ message: "Server Error!", error: error.message })
  }
}

export const GetUserLikedPosts = async (req, res) => {
  try {
    const { username } = req.params
    const currentUserId = req.user.id
    
    let pageNumber = req.query.page ? Number(req.query.page) : 1;
    let limitNumber = req.query.limit ? Number(req.query.limit) : 10;
    if (limitNumber > 20) limitNumber = 20;
    const skip = (pageNumber - 1) * limitNumber

    const targetUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    })

    if (!targetUser) return res.status(404).json({ message: "User not found" });

    const [totalLikes, likes] = await Promise.all([
      prisma.likes.count({ where: { userId: targetUser.id } }),
      prisma.likes.findMany({
        where: { userId: targetUser.id },
        include: {
          post: {
            include: {
              user: { select: { id: true, username: true, fullname: true, image: true } },
              likes: { where: { userId: currentUserId }, select: { userId: true } },
              bookmarks: { where: { userId: currentUserId }, select: { userId: true } }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: limitNumber,
        skip,
      })
    ])

    const formattedPosts = likes.map(likeItem => {
      // Ratakan struktur agar mendapat array post
      const { likes, bookmarks, ...postData } = likeItem.post;
      return {
        ...postData,
        isLikedByMe: likes.length > 0,
        isBookmarkedByMe: bookmarks.length > 0,
      }
    })

    return res.status(200).json({
      success: true,
      pagination: {
        current_page: pageNumber,
        total_pages: Math.ceil(totalLikes / limitNumber),
        total_items: totalLikes,
        limit_per_page: limitNumber,
      },
      data: formattedPosts,
    })
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ message: "Server Error!", error: error.message })
  }
}

export const GetUserBookmarks = async (req, res) => {
  try {
    const { username } = req.params
    const currentUserId = req.user.id
    
    const targetUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    })

    if (!targetUser) return res.status(404).json({ message: "User not found" });

    // Keamanan: Tolak jika mencoba melihat bookmark orang lain
    if (targetUser.id !== currentUserId) {
      return res.status(403).json({ message: "You can only view your own bookmarks" });
    }

    let pageNumber = req.query.page ? Number(req.query.page) : 1;
    let limitNumber = req.query.limit ? Number(req.query.limit) : 10;
    if (limitNumber > 20) limitNumber = 20;
    const skip = (pageNumber - 1) * limitNumber

    const [totalBookmarks, bookmarks] = await Promise.all([
      prisma.bookmarks.count({ where: { userId: targetUser.id } }),
      prisma.bookmarks.findMany({
        where: { userId: targetUser.id },
        include: {
          post: {
            include: {
              user: { select: { id: true, username: true, fullname: true, image: true } },
              likes: { where: { userId: currentUserId }, select: { userId: true } },
              bookmarks: { where: { userId: currentUserId }, select: { userId: true } }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: limitNumber,
        skip,
      })
    ])

    const formattedPosts = bookmarks.map(bookmarkItem => {
      const { likes, bookmarks, ...postData } = bookmarkItem.post;
      return {
        ...postData,
        isLikedByMe: likes.length > 0,
        isBookmarkedByMe: bookmarks.length > 0,
      }
    })

    return res.status(200).json({
      success: true,
      pagination: {
        current_page: pageNumber,
        total_pages: Math.ceil(totalBookmarks / limitNumber),
        total_items: totalBookmarks,
        limit_per_page: limitNumber,
      },
      data: formattedPosts,
    })
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ message: "Server Error!", error: error.message })
  }
}

export const GetSearchUsers = async (req, res) => {
  try {

    // req query parameters (untuk mencari user secara umum/berdasarkan keyword)
    const { username, query, q } = req.query

    const searchTerm = (username || query || q || '').trim();

    if(!searchTerm) {
      return res.status(400).json({
        message: "Search query parameter cannot be empty!",
      })
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            username: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          {
            fullname: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        ],
      },
      take: 10,
      select: {
        id: true,
        username: true,
        fullname: true,
        image: true,
      }
    })

    res.status(200).json({
      message: "Get search users success",
      data: users,
    })
  } catch (error) {
    console.error("Error in GetSearchUsers controller:", error);
    return res.status(500).json({
      message: "Server Error!",
      error: error.message,
    })
  }
}

export const UpdateUser = async (req, res) => {
  try {
    // Validasi zod
     const userSchema = z.object({
          fullname: z.string().min(3, "Fullname minimal 3 karakter").max(100, "Fullname maksimal 100 karakter"),
          username: z.string().min(3, "Username minimal 3 karakter").max(100, "Username maksimal 100 karakter"),
          bio: z.string().max(100, "Bio maksimal 100 karakter"),
        });
    
        // 2. Lakukan validasi. Jika gagal, Zod akan melempar ZodError ke blok catch.
        const validatedData = userSchema.parse(req.body);

    // validasi username udah terdaftar atau belum, kecuali username nya punya user itu sendiri
    const currentUser = await prisma.user.findUnique({
      where: {
        username: validatedData.username
      }
    })

    // cek apakah username sudah digunakan user lain, jika ya maka return error, jika tidak dan username sama dengan user itu sendiri maka lanjutkan proses update user
    if(currentUser && currentUser.id !== req.user.id){
      return res.status(400).json({
        message: "Username already used, try another username!"
      })
    }

    // update user ke database
    const updateUser = await prisma.user.update({
      where: {
        id: req.user.id,
      }, 
      data: {
        username: validatedData.username,
        fullname: validatedData.fullname,
        bio: validatedData.bio,
      },
      omit: {
        password: true,
      }
    })

    // response success
    return res.status(200).json({
      message: "Update user success",
      data: updateUser,
    })
  } catch (error) {
    // Error zod
     if (error instanceof z.ZodError) {
          const errors = error.issues.map((i) => i.message);
          console.log("Validation Errors:", errors);
          return res.status(400).json({
            message: errors,
          });
        }

    // Error express
    console.error("Server Error:", error);
    return res.status(500).json({
      message: "Server Error!",
      error: error.message,
    })
  }
}

export const UpdateUserAvatar = async (req, res) => {
  try {
    // validasi file udah di upload atau belum
    if(!req.file) {
      return res.status(400).json({
        message: "Image is required"
      })
    }

    // ambil data current user (user yang login saat ini) dari req user id (untuk cek imageId user sebelumnya)
    const currentUser = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      }
    })

    // kalo user sudah punya image, hapus dulu image sebelum upload image baru
    if(currentUser.imageId) {
      await cloudinary.uploader.destroy(currentUser.imageId)
    }

    // Ubah buffer(data gambar yang diunggah multer) menjadi string base64 dengan format data URI agar bisa diupload ke cloudinary
    const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`

    // Upload image ke cloudinary
    const result = await cloudinary.uploader.upload(fileStr, {
      folder: "avatar",
      transformation: {
        width: 250,
        height: 250,
        crop: "fill"
      },
      resource_type: "image",
      size_limit: "2mb",
    })

    // Update userImage dan imageId di database tabel user (simpan data ke database dan mengembalikan data yang diupdate)
    const updateUserAva = await prisma.user.update({
      where: {
        id: req.user.id,
      }, 
      data: {
        image: result.secure_url,
        imageId: result.public_id,
      },
      omit: {
        password: true,
        
      }
    })

    // response success
    return res.status(201).json({
      message: "Update user avatar success",
      data: updateUserAva,
    })
  } catch (error) {
     // Error express
    console.error("Server Error:", error);
    return res.status(500).json({
      message: "Server Error!",
      error: error.message,
    })
  }
}
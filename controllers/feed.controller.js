import prisma from "../utils/prisma.js";
import cloudinary from "../utils/cloudinary.js";

export const CreatePost = async (req, res) => {
  try {
    const { caption } = req.body;
    const currentUserId = req.user.id;

    // Validation
    if (!caption) {
      return res.status(400).json({
        message: "Caption is required",
      })
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Image is required",
      })
    }

    // Ubah buffer(data gambar yang diunggah multer) menjadi string base64 dengan format data URI agar bisa diupload ke cloudinary
    const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`
    
    // Upload image ke cloudinary
    const result = await cloudinary.uploader.upload(fileStr, {
      folder: "posts",
      transformation: {
        width: 1080,
        crop: "limit",
      },
      quality: "auto",
      fetch_format: "auto",
      resource_type: "image",
      secure: true,
    })
    
    const newPost = await prisma.post.create({
      data: {
        caption,
        image: result.secure_url,
        imageId: result.public_id,
        userId: Number(currentUserId),
      }
    })

    await prisma.user.update({
      where: {
        id: Number(currentUserId),
      },
      data: {
        postsCount: {
          increment: 1,
        }
      }
    })

    return res.status(201).json({
      message: "Create post success",
      data: newPost,
    })
    
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({
      message: "Server Error!",
      error: error.message,
    })
  }
}

export const GetFeed = async(req, res) => {
  try {
    const currentUserId = req.user.id;
    
    // 1. Ambil ID user yang difollow oleh current user
    const followings = await prisma.follows.findMany({
      where: {
        followerId: Number(currentUserId),
      },
      select: {
        followingId: true,
      },
    })

  // Ambil postingan dari user yang di following + postingan diri sendiri
    const followingIds = followings.map((following) => following.followingId)
    // Gabungkan ID following dengan ID diri sendiri
    const feedUserIds = [...followingIds, Number(currentUserId)]

    // 2. Setup Pagination
    let pageNumber = req.query.page ? Number(req.query.page) : 1;
    let limitNumber = req.query.limit ? Number(req.query.limit) : 10;
    
    // Proteksi limit maksimal (diubah menjadi 20 agar lebih fleksibel)
    if (limitNumber > 20) {
      limitNumber = 20;
    }
    
    const skip = (pageNumber - 1) * limitNumber

    // 3. Eksekusi query Count dan FindMany secara paralel menggunakan Promise.all 
    // untuk mempercepat waktu response API
    const [totalPosts, posts] = await Promise.all([
      prisma.post.count({
        where: {
          userId: {
            in: feedUserIds,
          }
        }
      }),
      prisma.post.findMany({
        where: {
          userId: {
            in: feedUserIds,
          }
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullname: true,
              image: true,
            },
          },
          likes: {
            where: { userId: Number(currentUserId) },
            select: { userId: true },
          },
          bookmarks: {
            where: { userId: Number(currentUserId) },
            select: { userId: true },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limitNumber,
        skip,
      })
    ])

    const totalPages = Math.ceil(totalPosts / limitNumber)

    // Meratakan data dan menyuntikkan isLikedByMe dan isBookmarkedByMe
    const formattedPosts = posts.map((post) => {
      const { likes, bookmarks, ...postData } = post;
      
      return {
        ...postData,
        isLikedByMe: likes.length > 0,
        isBookmarkedByMe: bookmarks.length > 0,
      };
    });

    return res.status(200).json({
      success: true,
      code: 200,
      message: "Get feed success",
      pagination: {
        current_page: pageNumber,
        total_pages: totalPages,
        total_items: totalPosts,
        limit_per_page: limitNumber,
      },
      data: formattedPosts,
    })
    
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({
      message: "Server Error!",
      error: error.message,
    })
  }
}

export const GetDetailPost = async(req, res) => {
  const { postId } = req.params;

  try {
    const post = await prisma.post.findUnique({
      where: {
        id: Number(postId),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullname: true,
            image: true,
          },
        },
        comments: {
          select: {
            content: true,
            createdAt: true,
            user: {
              select: {
              id: true,
              username: true,
              fullname: true,
              image: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          }
        },
      },
    })

    if(!post) {
      return res.status(404).json({
        message: "Post not found",
      })
    }
    
    return res.status(200).json({
      message: "Get detail post success",
      data: post,
    })
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({
      message: "Server Error!",
      error: error.message,
    })
  }
}

export const DeletePost = async (req, res) => {
  const { postId } = req.params;
  const currentUserId = req.user.id;

  try {
    // Cek apakah post ada di database
    const postData = await prisma.post.findUnique({
      where: {
        id: Number(postId),
      }
    })

    if(!postData) {
      return res.status(404).json({
        message: "Post not found",
      })
    }

    if(postData.userId !== currentUserId) {
      return res.status(403).json({
        message: "You are not authorized to delete this post",
      })
    }

    // Delete image dari cloudinary dulu
    if(postData.imageId) {
      await cloudinary.uploader.destroy(postData.imageId)
    }

    // Delete post dari database
    await prisma.post.delete({
      where: {
        id: Number(postId),
      }
    })

    // Update postsCount user
    await prisma.user.update({
      where: {
        id: Number(currentUserId),
      },
      data: {
        postsCount: {
          decrement: 1,
        }
      }
    })

    return res.status(200).json({
      message: "Delete post success",
    })

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({
      message: "Server Error!",
      error: error.message,
    })
  }
}
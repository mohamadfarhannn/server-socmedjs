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
    const posts = await prisma.post.findMany(
    {
      include: {
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
    })

    return res.status(200).json({
      message: "Get feed success",
      data: posts,
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
import prisma from "../utils/prisma.js";

export const likePost = async(req,res)=>{
  try {
    // Request
    const currentUserId = req.user.id
    const postId = Number(req.params.postId)

    // Jalankan insert dan update bersamaan 
    const [newLike] = await prisma.$transaction([
      prisma.likes.create({
        data: {
          userId: currentUserId,
          postId: postId,
        }
      }),
      prisma.post.update({
        where: { id: postId },
        data: { 
          likesCount: { increment: 1 } 
        }
      })
    ])

    return res.status(201).json({
      message: "Post liked successfully",
      data: newLike,
    })

  } catch (error) {
     // P2002: Unique constraint failed (Artinya user sudah pernah nge-like)
     if (error.code === 'P2002') {
      return res.status(400).json({
        message: "You already liked this post",
      })
     }

    // P2003: Foreign key constraint failed (Artinya postId tidak ditemukan di tabel Post)
    if (error.code === 'P2003') {
      return res.status(404).json({
        message: "Post not found",
      })
    }

    console.error("Error in likePost controller:", error);
    return res.status(500).json({
      message: "Server down",
      error: error.message,
    })
  }
}

export const unlikePost = async(req, res)=>{
  try{
    // Request
    const currentUserId = req.user.id
    const postId  = Number(req.params.postId)

     // Jalankan DELETE dan UPDATE secara bersamaan dalam 1 Transaksi atomik
     await prisma.$transaction([
      prisma.likes.delete({
        where: {
          userId_postId: {
            userId: currentUserId,
            postId: postId,
          }
        }
      }),
      prisma.post.update({
        where: { id: postId },
        data: {
          likesCount: { decrement: 1 }
        }
      })
     ])

    return res.status(200).json({
      message: "Post unliked successfully",
    })
  } catch (error) {
    // P2025: Record to delete does not exist (Artinya Like tidak ditemukan / Post tidak ada)
    if (error.code === 'P2025') {
      return res.status(404).json({
        message: "Like not found or You haven't liked this post",
      })
    }

    console.error("Error in unlikePost controller:", error);
    return res.status(500).json({
      message: "Server down",
      error: error.message,
    })
  }
}

export const checkUserLikedPost = async (req,res) => {
  try {
    const postId = Number(req.params.postId)
    const currentUserId = req.user.id

    // cek apakah user udah like
    const checkLike = await prisma.likes.findUnique({
      where:{
        userId_postId: {
          userId: currentUserId,
          postId: postId
        }
      }
    })

   // Jika ketemu kembalikan true, jika tidak kembalikan false
  //  !!checklike : menjdikan nilai boolean. true jika ada, false jika tidak ada
    return res.status(200).json({ data: !!checkLike }) 

  } catch (error) {
    console.error("Error in CheckUserLikedPost controller:", error);
    return res.status(500).json({
      message: "Server down",
      error: error.message,
    })
  }
}

export const getPostLikes = async (req, res) => {
  try {
    const postId = Number(req.params.postId)

    const getLikes = await prisma.likes.findMany({
      where: {
        postId: postId
      },
      take: 10,
      select: {
        user: {
          select: {
            username: true,
            fullname: true,
            image: true
          }
        }
      }
    })

    const formattedLikes = getLikes.map(like => like.user)
    
    return res.status(200).json({
      data: formattedLikes
    })
  } catch (error) {
    console.error("Error in getPostLikes controller:", error);
    return res.status(500).json({
      message: "Server down",
      error: error.message,
    })
  }
}
import prisma from "../utils/prisma.js";
import z from "zod";

export const CreateComment = async (req, res) => {
    try {
      const commentSchema = z.object({
        postId: z.number({
          required_error: "Post ID is required",
          invalid_type_error: "Post ID must be a number",
        }).int().positive(),
        content: z.string()
        .min(1, "Comment content is required")
        .max(1000, "Comment content is too long, max 1000 characters"),
      })

      // Mapping body request ke schema z
      const validatedData = commentSchema.parse(req.body);

      const currentUserId = req.user.id
      const { postId, content } = validatedData

      // Jika postId tidak ada, Prisma otomatis akan melempar error P2003 (Foreign Key) atau P2025 (Record not found)
      const [newComment] = await prisma.$transaction([
        prisma.comments.create({
          data: {
            userId: Number(currentUserId),
            postId: Number(postId),
            content
          },
        }),
        prisma.post.update({
          where: {
            id: Number(postId)
          },
          data: {
            commentsCount: { increment: 1 }
          }
        })
      ])

      return res.status(201).json({ 
        success: true,
        code: 201,
        message: "Comment created successfully!", 
        data: newComment
      })
    } catch (error) {
      // Tangani pesan error dari validasi Zod
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((i) => i.message);
        return res.status(400).json({
          message: errors,
        })
      }

      // P2003 (Foreign key) atau P2025 (Record not found): Artinya postId tidak ditemukan di tabel Post
      if (error.code === 'P2003' || error.code === 'P2025') {
        return res.status(404).json({
          message: "Post not found",
        })
      }

      console.error("CreateComment error : ",error)
      return res.status(500).json({ message: "Server error!" })
    }
}

export const GetCommentsByPostId = async (req, res) => {
    try {
      const { postId } = req.params

      if(!postId) {
        return res.status(400).json({ message: "Post ID is required!" })
      }

      // 1. Cek apakah postingan ada (hanya mengambil ID)
      const postExists = await prisma.post.findUnique({
        where: { 
          id: Number(postId)
        },
        select: {
          id: true
        }
      })

      if(!postExists) {
        return res.status(404).json({ message: "Post not found!" })
      }

      // 2. Ambil komentar langsung dari tabel Comments
      // Pagination: Ambil dari query param, set default page = 1 dan limit = 10
      let pageNumber = req.query.page ? Number(req.query.page) : 1;
      let limitNumber = req.query.limit ? Number(req.query.limit) : 10;

      // Proteksi agar limit tidak berlebihan (mencegah server overload)
      if (limitNumber > 30) {
        limitNumber = 30;
      }

      const skip = (pageNumber - 1) * limitNumber;

      const comments = await prisma.comments.findMany({
        where: {
          postId: Number(postId)
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullname: true,
              image: true
            }
          }
        },
        orderBy: {
          createdAt: "asc" // Urutkan dari komentar terlama ke terbaru (kronologis)
        },
        take: limitNumber,
        skip
      })

      // Hitung total komentar untuk post ini
      const totalComments = await prisma.comments.count({
        where: {
          postId: Number(postId)
        }
      })

      return res.status(200).json({
        success: true,
        code: 200,
        message: "Success get comments data list.",
        pagination:{
          current_page: pageNumber,
          total_pages: Math.ceil(totalComments / limitNumber),
          total_items: totalComments,
          limit_per_page: limitNumber,
        },
        data: comments,
      })

    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: "Server error!" })
    }
}

export const DeleteComment = async (req, res) => {
    try {
      const currentUserId = req.user.id
      const { commentId } = req.params

      if(!commentId) {
        return res.status(400).json({ message: "Comment ID is required!" })
      }
 
      const commentData = await prisma.comments.findUnique({
        where: {
          id: Number(commentId)
        }
      })

      if(!commentData) {
        return res.status(404).json({ message: "Comment not found!" })
      }

      if(commentData.userId !== currentUserId) {
        return res.status(403).json({ message: "You are not authorized to delete this comment!" })
      }

      await prisma.comments.delete({
        where: {
          id: Number(commentId)
        }
      })

      await prisma.post.update({
        where: {
          id: Number(commentData.postId)
        },
        data: {
          commentsCount: { decrement: 1 }
        }
      })

      return res.status(200).json({ message: "Comment deleted successfully!" })
      
    } catch (error) {
      console.error(error)
        return res.status(500).json({ message: "Server error!" })
    }
}
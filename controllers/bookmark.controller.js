import prisma from "../utils/prisma.js"

export const getBookmarks = async (req, res) => {
  try {
    const currentUserId = req.user.id
    const getBookmarks = await prisma.bookmarks.findMany({
      where:{
        userId: currentUserId
      }, 
      take: 10,
      orderBy: {
        createdAt: "desc"
      },
      select: {
        post: {
          select: {
            id: true,
            caption: true,
            image: true,
            user: {
              select: {
                username: true,
                fullname: true,
                image: true
              }
            },
            likesCount: true,
            commentsCount: true,
            createdAt: true,
          },
        },
      },
    })

    const formattedBookmarks = getBookmarks.map(bookmark => bookmark.post)

    return res.status(200).json({
      data: formattedBookmarks
    })
    

  } catch (error) {
    console.log("Error in GetBookmarks controller:", error)
    return res.status(500).json({
      message: "Server down",
      error: error.message
    })
  }
}

export const createBookmark = async (req, res) => {
  try {
    const currentUserId = req.user.id
    const postId = Number(req.params.postId)
    
    const createBookmark = await prisma.bookmarks.create({
      data: {
        userId: currentUserId,
        postId: postId
      }
    })

    return res.status(201).json({
      message: "Bookmark created successfully",
      data: createBookmark
    })
    
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        message: "You already bookmarked this post",
      })
    }

    if (error.code === "P2003") {
      return res.status(404).json({
        message: "Post not found",
      })
    }

    console.error("Error in CreateBookmark controller:", error)
    return res.status(500).json({
      message: "Server down",
      error: error.message
    })
  }
}

export const removeBookmark = async (req, res) => {
  try {
    const currentUserId = req.user.id
    const postId = Number(req.params.postId)

    await prisma.bookmarks.delete({
      where:{
        userId_postId: {
          userId: currentUserId,
          postId: postId
        }
      }
    })

    return res.status(200).json({
      message: "Bookmark removed successfully",
    })

  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        message: "Bookmark not found or You haven't bookmarked this post",
      })
    }

    console.error("Error in RemoveBookmark controller:", error)
    return res.status(500).json({
      message: "Server down",
      error: error.message
    })
  }
}

// untuk memberitahu frontend (UI) bagaimana harus menampilkan tombol atau ikon bookmark saat pertama kali render di halaman feed
export const checkUserBookmarkedPost = async (req, res) => {
  try {
    const currentUserId = req.user.id
    const postId = Number(req.params.postId)

    const checkUserBookmark = await prisma.bookmarks.findUnique({
      where: {
        userId_postId: {
          userId: currentUserId,
          postId: postId
        }
      }
    })

    return res.status(200).json({ 
      data: !!checkUserBookmark 
    })
    
  } catch (error) {
    console.error("Error in CheckUserBookmark controller:", error)
    return res.status(500).json({
      message: "Server down",
      error: error.message
    })
  }
}

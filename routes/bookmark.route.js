import express from 'express'
import { AuthMiddleware } from '../middleware/auth.middleware.js'
import { createBookmark, removeBookmark, getBookmarks, checkUserBookmarkedPost } from '../controllers/bookmark.controller.js'

const BookmarkRouter = express.Router()

// Get My Bookmarks
BookmarkRouter.get("/", AuthMiddleware, getBookmarks)

// Add Bookmark
BookmarkRouter.post("/:postId", AuthMiddleware, createBookmark)

// Remove Bookmark
BookmarkRouter.delete("/:postId", AuthMiddleware, removeBookmark)

// Check User Bookmark
BookmarkRouter.get("/:postId/me", AuthMiddleware, checkUserBookmarkedPost)

export default BookmarkRouter
import express from 'express'
import { AuthMiddleware } from '../middleware/auth.middleware.js'
import { likePost, unlikePost, checkUserLikedPost, getPostLikes } from '../controllers/like.controller.js'

const LikeRouter = express.Router()

// Get Likes
LikeRouter.get('/:postId/likes', AuthMiddleware, getPostLikes)
// Add like
LikeRouter.post('/:postId/likes', AuthMiddleware, likePost)
// Unlike
LikeRouter.delete('/:postId/likes', AuthMiddleware, unlikePost)
// Check like status
LikeRouter.get('/:postId/likes/me', AuthMiddleware, checkUserLikedPost)

export default LikeRouter
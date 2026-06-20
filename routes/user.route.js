import express from "express";
import { GetSearchUsers, GetUserInfo, UpdateUser, UpdateUserAvatar, GetUserPosts, GetUserLikedPosts, GetUserBookmarks } from "../controllers/user.controller.js";
import { AuthMiddleware } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const UserRouter = express.Router()

// Note: /search harus di atas /:username agar tidak ter-intercept
UserRouter.get('/search', AuthMiddleware, GetSearchUsers)

// Get Profile user
UserRouter.get('/:username', AuthMiddleware, GetUserInfo)
UserRouter.get('/:username/posts', AuthMiddleware, GetUserPosts)
UserRouter.get('/:username/likes', AuthMiddleware, GetUserLikedPosts)
UserRouter.get('/:username/bookmarks', AuthMiddleware, GetUserBookmarks)

// Update profile user
UserRouter.put('/update-user', AuthMiddleware, UpdateUser)
UserRouter.put('/update-user-avatar', AuthMiddleware, upload.single('image'), UpdateUserAvatar)

export default UserRouter
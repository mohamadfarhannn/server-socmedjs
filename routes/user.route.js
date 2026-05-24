import express from "express";
import { GetSearchUsers, GetUserByUsername, UpdateUser, UpdateUserAvatar } from "../controllers/user.controller.js";
import { AuthMiddleware } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const UserRouter = express.Router()

UserRouter.get('/search', AuthMiddleware, GetSearchUsers)
UserRouter.get('/:username', AuthMiddleware, GetUserByUsername)
UserRouter.put('/update-user', AuthMiddleware, UpdateUser)
UserRouter.put('/update-user-avatar', AuthMiddleware, upload.single('image'), UpdateUserAvatar)

export default UserRouter
import express from "express";
import { FollowUserAccount, UnfollowUserAccount } from "../controllers/follow.controller.js";
import { AuthMiddleware } from "../middleware/auth.middleware.js";

const FollowRouter = express.Router()

FollowRouter.post("/", AuthMiddleware, FollowUserAccount)
FollowRouter.delete("/:id", AuthMiddleware, UnfollowUserAccount)

export default FollowRouter
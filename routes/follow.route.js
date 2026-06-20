import express from "express";
import { GetUserSuggestions, FollowUserAccount, UnfollowUserAccount, checkUserFollowed } from "../controllers/follow.controller.js";
import { AuthMiddleware } from "../middleware/auth.middleware.js";

const FollowRouter = express.Router()

FollowRouter.post("/", AuthMiddleware, FollowUserAccount)
FollowRouter.delete("/:id", AuthMiddleware, UnfollowUserAccount)
FollowRouter.get("/suggestions", AuthMiddleware, GetUserSuggestions)
FollowRouter.get("/:id/followed", AuthMiddleware, checkUserFollowed)

export default FollowRouter
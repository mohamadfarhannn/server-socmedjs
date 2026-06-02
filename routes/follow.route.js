import express from "express";
import { GetUserSuggestions, FollowUserAccount, UnfollowUserAccount } from "../controllers/follow.controller.js";
import { AuthMiddleware } from "../middleware/auth.middleware.js";

const FollowRouter = express.Router()

FollowRouter.post("/", AuthMiddleware, FollowUserAccount)
FollowRouter.delete("/:id", AuthMiddleware, UnfollowUserAccount)
FollowRouter.get("/suggestions", AuthMiddleware, GetUserSuggestions)

export default FollowRouter
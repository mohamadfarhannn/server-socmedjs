import express from "express";
import { AuthMiddleware } from "../middleware/auth.middleware.js";
import { CreateComment, GetCommentsByPostId, DeleteComment } from "../controllers/comment.controller.js";

const CommentRouter = express.Router()

CommentRouter.get("/post/:postId", AuthMiddleware, GetCommentsByPostId)
CommentRouter.delete("/:commentId", AuthMiddleware, DeleteComment)
CommentRouter.post("/", AuthMiddleware, CreateComment)

export default CommentRouter
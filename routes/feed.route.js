import express from 'express';
import { AuthMiddleware } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';
import { CreatePost, GetFeed, GetDetailPost, DeletePost } from '../controllers/feed.controller.js';

const FeedRouter = express.Router();
FeedRouter.post("/", AuthMiddleware, upload.single("image"), CreatePost);
FeedRouter.get("/", AuthMiddleware, GetFeed);
FeedRouter.get("/:postId", AuthMiddleware, GetDetailPost);
FeedRouter.delete("/:postId", AuthMiddleware, DeletePost);

export default FeedRouter
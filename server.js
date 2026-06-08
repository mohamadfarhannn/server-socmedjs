import 'dotenv/config';
import express from 'express';
import { swaggerDocs } from './utils/swagger.js';
import AuthRouter from './routes/auth.route.js'
import UserRouter from './routes/user.route.js'
import FollowRouter from './routes/follow.route.js'
import FeedRouter from './routes/feed.route.js'
import CommentRouter from './routes/comment.route.js'

const app = express()
const port = 3000

// middleware untuk parse body json, biar bisa baca req.body
app.use(express.json())

// middleware untuk menangani CORS (Cross-Origin Resource Sharing)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// routes
app.use('/api/auth', AuthRouter)
app.use('/api/user', UserRouter)
app.use('/api/follow', FollowRouter)    
app.use('/api/feed', FeedRouter)
app.use('/api/comment',CommentRouter)

// initialize swagger
swaggerDocs(app, port);

// start server
app.listen(port, () => {
  console.log(`Server jalan di port ${port}`)
})

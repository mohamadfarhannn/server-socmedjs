import 'dotenv/config';
import express from 'express';
import AuthRouter from './routes/auth.route.js'
import UserRouter from './routes/user.route.js'
import FollowRouter from './routes/follow.route.js'
import FeedRouter from './routes/feed.route.js'
import CommentRouter from './routes/comment.route.js'

const app = express()
const port = 3000

// middleware untuk parse body json, biar bisa baca req.body
app.use(express.json())

// routes
app.use('/api/auth', AuthRouter)
app.use('/api/user', UserRouter)
app.use('/api/follow', FollowRouter)    
app.use('/api/feed', FeedRouter)
app.use('/api/comment',CommentRouter)

// start server
app.listen(port, () => {
  console.log(`Server jalan di port ${port}`)
})

import express from 'express'
import { RegisterController, LoginController, GetUser } from '../controllers/auth.controller.js'
import { AuthMiddleware } from '../middleware/auth.middleware.js'

const AuthRouter = express.Router()

AuthRouter.post('/register', RegisterController)
AuthRouter.post('/login', LoginController)
AuthRouter.get('/me', AuthMiddleware, GetUser)

export default AuthRouter

import express from 'express'
import { RegisterController, LoginController, GetUser, VerifyOTPController, ResendOTPController } from '../controllers/auth.controller.js'
import { AuthMiddleware } from '../middleware/auth.middleware.js'

const AuthRouter = express.Router()

AuthRouter.post('/register', RegisterController)
AuthRouter.post('/login', LoginController)
AuthRouter.post('/verify-email', VerifyOTPController)
AuthRouter.post('/resend-otp', ResendOTPController)
AuthRouter.get('/me', AuthMiddleware, GetUser)

export default AuthRouter

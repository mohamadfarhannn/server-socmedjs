import express from 'express'
import { RegisterController, LoginController, GetUser, VerifyOTPController, ResendOTPController, ForgotPasswordController, ResetPasswordController, LogoutController } from '../controllers/auth.controller.js'
import { AuthMiddleware } from '../middleware/auth.middleware.js'

const AuthRouter = express.Router()

AuthRouter.post('/register', RegisterController)
AuthRouter.post('/login', LoginController)
AuthRouter.post('/verify-email', VerifyOTPController)
AuthRouter.post('/resend-otp', ResendOTPController)
AuthRouter.get('/me', AuthMiddleware, GetUser)
AuthRouter.post('/forgot-password', ForgotPasswordController)
AuthRouter.post('/reset-password', ResetPasswordController)
AuthRouter.post('/logout', LogoutController)

export default AuthRouter

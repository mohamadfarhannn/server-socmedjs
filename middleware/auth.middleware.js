import jwt from "jsonwebtoken";
import prisma from "../utils/prisma.js";

export const AuthMiddleware = async (req, res, next) => {
  const jwtSecret = process.env.JWT_SECRET;

  try {
    const headers = req.headers.authorization;

    if(!headers) {
      return res.status(401).json({
        message: "Authorization error, please login first"
      });
    }

    // Index 0 bearer, Index 1 jwt
    const token = headers.split("Bearer ")[1];
    const decoded = jwt.verify(token, jwtSecret);
    
   const currentUser = await prisma.user.findUnique({
    where: {
      id: decoded.id
    }
   })

   req.user = {
    id: currentUser.id,
    fullname: currentUser.fullname,
    username: currentUser.username,
    email: currentUser.email,
    image: currentUser.image,
    bio: currentUser.bio,
   }

   next()

  } catch (error) {
    if(error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired, please login again",
      })
    }

    if(error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid token, authorization failed",
      })
    }

    res.status(500).json({
      message: "Server Error",
      error: error.message,
    })
  }
  
}
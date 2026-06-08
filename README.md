# DailyGrind - Server (Instagram Clone API)

A robust and scalable backend API for **DailyGrind**, a modern social media application inspired by Instagram. Built with **Node.js, Express.js, Prisma ORM, and PostgreSQL**, this project was developed as part of a professional portfolio to demonstrate full-stack engineering skills. It provides a complete set of features for user authentication, social interactions, media uploads, and feed management.

## 🚀 Features

* **Authentication & Authorization:**
  * User registration and login with Email/Password.
  * OTP-based email verification using `nodemailer`.
  * Google OAuth 2.0 integration for seamless login.
  * JWT-based secure sessions.
* **User Management:**
  * Update profile details (bio, username, fullname).
  * Profile picture uploads managed by **Cloudinary**.
  * Advanced full-text user search with PostgreSQL `pg_trgm` optimization.
* **Social Interactions (Follow System):**
  * Follow and unfollow users.
  * Real-time counters for followers, following, and posts.
* **Posts & Feed:**
  * Create, view, and delete posts with image support (via Cloudinary & Multer).
  * Feed system retrieving relevant posts for users.
* **Engagement:**
  * Like/Unlike posts.
  * Comment on posts.
  * Bookmark posts for later reading.

## 📊 Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o{ Post : creates
    User ||--o{ Comments : writes
    User ||--o{ Bookmarks : saves
    User ||--o{ Likes : likes
    User ||--o{ Follows : "follows (followerId)"
    User ||--o{ Follows : "followed by (followingId)"
    User ||--o| OtpVerivication : "verifies with"

    User {
        Int id PK
        String email UK
        String fullname
        String username UK
        String password
        Boolean is_verified
        String bio
        String image
        Int followingCount
        Int followersCount
        Int postsCount
        DateTime createdAt
        DateTime updatedAt
    }

    OtpVerivication {
        Int id PK
        String otp_code
        DateTime expires_at
        Int userId FK
    }

    Post {
        Int id PK
        Int userId FK
        String image
        String caption
        Int commentsCount
        Int likesCount
        DateTime createdAt
        DateTime updatedAt
    }

    Comments {
        Int id PK
        Int userId FK
        Int postId FK
        String content
        DateTime createdAt
        DateTime updatedAt
    }

    Bookmarks {
        Int userId PK, FK
        Int postId PK, FK
        DateTime createdAt
    }

    Likes {
        Int userId PK, FK
        Int postId PK, FK
        DateTime createdAt
    }

    Follows {
        Int followerId PK, FK
        Int followingId PK, FK
        DateTime createdAt
    }
```

## 🛠️ Technology Stack

* **Runtime:** Node.js (ES Modules)
* **Framework:** Express.js
* **Database:** PostgreSQL
* **ORM:** Prisma
* **Authentication:** JWT, bcrypt, Google Auth Library
* **Media Storage:** Cloudinary, Multer
* **Email Service:** Nodemailer
* **Validation:** Zod

## ⚙️ Prerequisites

Before you begin, ensure you have met the following requirements:
* Node.js (v18+ recommended)
* PostgreSQL database (Local or Cloud like Neon/Supabase)
* Cloudinary Account (for media uploads)
* Google Cloud Console Project (for Google OAuth Client ID)
* SMTP Mail Account (e.g., Gmail App Passwords for sending OTPs)

## 📦 Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables Configuration:**
   Copy the example environment file and fill in your credentials.
   ```bash
   cp .env.example .env
   ```
   **Required `.env` variables:**
   ```env
   PORT=3000
   DATABASE_URL="postgresql://username:password@localhost:5432/dbname?schema=public"
   JWT_SECRET="your_jwt_secret_here"
   CLOUDINARY_CLOUD_NAME="your_cloudinary_name"
   CLOUDINARY_API_KEY="your_api_key"
   CLOUDINARY_API_SECRET="your_api_secret"
   EMAIL_USER="your_email_here"
   EMAIL_PASS="your_email_password_here"
   GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
   ```

3. **Database Setup & Migration:**
   Generate Prisma client and migrate your database schema.
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. **Seed Database (Optional):**
   Populate the database with mock users and posts for testing.
   ```bash
   node prisma/seed.js
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The server will start at `http://localhost:3000`.

## 📂 Project Structure

```text
├── controllers/    # Request handlers containing business logic
├── middleware/     # Express middlewares (Auth, Multer, Error handlers)
├── prisma/         # Prisma schema (schema.prisma) and seed script
├── routes/         # Express API route definitions
├── utils/          # Helper functions and utilities
├── server.js       # Application entry point & Express setup
├── package.json    # Project metadata and scripts
└── .env.example    # Example environment variables
```

## 🔗 API Endpoints Overview

* **`/api/auth`**: Handle Registration, Login, Google OAuth, and OTP email verification.
* **`/api/user`**: Retrieve user profiles, update user information/avatars, and perform user searches.
* **`/api/feed`**: Fetch chronological/algorithmic feeds, create posts, handle likes, and bookmarks.
* **`/api/comment`**: Add, retrieve, and delete comments on specific posts.
* **`/api/follow`**: Handle following and unfollowing mechanisms between users.

## 📄 License
ISC

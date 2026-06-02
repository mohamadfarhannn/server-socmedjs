import prisma from "../utils/prisma.js";

export const FollowUserAccount = async (req, res) => {
    // ambil user id dari token
    // Akun yang melakukan follow (followerId)
    const currentUserId = req.user.id;

    // ambil id user yang mau di follow dari body
    // Akun yang difollow (followingId)
    const { followedUserId } = req.body;

    // Validasi input: pastikan followedUserId dikirim dan merupakan angka yang valid
    // id harus ada
    if (!followedUserId) {
      return res.status(400).json({
        message: "followedUserId is required in request body"
      });
    }

    // id harus berupa angka
    const targetUserId = Number(followedUserId);
    if (isNaN(targetUserId)) {
      return res.status(400).json({
        message: "followedUserId must be a valid number"
      });
    }

    // cek jika current user id sama dengan target user id, maka return error (mencegah follow diri sendiri)
    if (currentUserId === targetUserId) {
      return res.status(400).json({
        message: "You can't follow yourself!"
      })
    }

    // cek apakah userId yang akan difollow ada di database
    const otherUserId = await prisma.user.findUnique({
      where: {
        id: targetUserId,
      }
    })

    if(!otherUserId) {
      return res.status(404).json({
        message: "User not found",
      })
    }

    // cek apakah user yang akan diikuti sudah diikuti sebelumnya (Biar user ga bisa follow user yang sama lebih dari sekali)
    const alreadyFollowed = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        }
      },
    });

    if(alreadyFollowed) {
      return res.status(400).json({
        message: "You already followed this user",
      })
    }

    // Masukin ke database (follow)
    try {
      const follow = await prisma.follows.create({
        data: {
          followerId: currentUserId, 
          followingId: targetUserId,
        }
      })

      await prisma.user.update({
        where: {
          id: currentUserId
        },
        data: {
          followingCount: {
            increment: 1,
          }
        }
      })

      await prisma.user.update({
        where: {
          id: targetUserId
        },
        data: {
          followersCount: {
            increment: 1,
          }
        }
      })
    
      return res.status(200).json({
        message: "User followed successfully",
        data: follow,
      })
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Server down",
      })
    }
}

export const UnfollowUserAccount = async (req, res) => {
  const currentUserId = req.user.id
  const { id } = req.params

  if (!id) {
    return res.status(400).json({
      message: "User ID is required"
    });
  }

  const targetUserId = Number(id);
  if (isNaN(targetUserId)) {
    return res.status(400).json({
      message: "User ID must be a valid number"
    });
  }

  // cek apakah user yang akan di unfollow sama dengan user yang sedang login (Biar user ga bisa unfollow diri sendiri)
  if (targetUserId === currentUserId) {
    return res.status(400).json({
      message: "You can't unfollow yourself!",
    })
  }

  const targetUserUnfollow = await prisma.user.findUnique({
    where: {
      id: targetUserId,
    }
  })

  // validasi input
  // user yang mau di unfoll harus ada di database
  if(!targetUserUnfollow) {
    return res.status(404).json({
      message: "User not found",
    })
  }

  // cek apakah user yang akan di unfollow sudah diikuti sebelumnya (Biar user ga bisa unfollow user yang belum di follow)
  const alreadyUnfollowed = await prisma.follows.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: targetUserId,
      }
    },
  });

  if(!alreadyUnfollowed) {
    return res.status(400).json({
      message: "Can't unfollow, you don't follow this user!",
    })
  }

  // hapus dari database (unfollow)
  try {
    const unfollow = await prisma.follows.delete({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        }
      },
    })

    // update following count user yang sedang login
    await prisma.user.update({
      where: {
        id: currentUserId
      },
      data: {
        followingCount: {
          decrement: 1,
        }
      }
    })

    // update followers count user yang akan di unfollow
    await prisma.user.update({
      where: {
        id: targetUserId
      },
      data: {
        followersCount: {
          decrement: 1,
        }
      }
    })

    return res.status(200).json({
      message: "User unfollowed successfully",
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Server down",
    })
  }
}

export const GetUserSuggestions = async (req, res) => {
  try {
    const currentUserId = req.user.id

    const followedUser = await prisma.follows.findMany({
      where:{
        followerId: currentUserId,
      },
      select: {
        followingId: true,
      }
    })

    const followedIds = followedUser.map(f => f.followingId)

    const users = await prisma.user.findMany({
      where: {
        id: {
          notIn: [...followedIds, currentUserId]
        }
      },
      select: {
        id: true,
        username: true,
        fullname: true,
        image: true,
      },
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.status(200).json({
      message: "Get user suggestions success",
      data: users,
    })
  } catch (error) {
    console.error("Error in GetUserSuggestions controller:", error);
    return res.status(500).json({
      message: "Server down",
      error: error.message,
    })
  }
}




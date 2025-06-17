const { prisma } = require("../prisma/prisma-client");
const { fetchInstagramDataAfterLogin } = require("./instagram-controller");

// Simple in-memory storage for access tokens
const userTokens = new Map();

const instagramDataController = {
  // Store access token for user (called during login)
  storeUserToken: (userId, accessToken) => {
    userTokens.set(userId, accessToken);
    console.log(`Access token stored for user ${userId} (type: ${typeof userId})`);
  },

  refreshInstagramData: async (req, res) => {
    try {
      const userId = req.user.userId; 
      console.log(`Reload: userId = ${userId} (type: ${typeof userId})`);
      
      const accessToken = userTokens.get(userId); 
      console.log(`Reload: accessToken знайдено = ${!!accessToken}`);

  

      console.log(`Reload: Викликаю fetchInstagramDataAfterLogin(${userId}, accessToken)`);

      await fetchInstagramDataAfterLogin(userId, process.env.FACEBOOK_BASE_URL_ACCESS);

      console.log(`Reload: Instagram дані успішно завантажено для userId ${userId}`);

      res.json({
        message: "Instagram дані успішно оновлено"
      });

    } catch (error) {
      console.error("Помилка при оновленні Instagram даних:", error);
      res.status(500).json({ 
        message: "Помилка при оновленні Instagram даних" 
      });
    }
  },

  reciveDataInstagram: async (req, res) => {
    try {
      const reciveData = await prisma.socialMediaPost.findMany({
        include: {
          comments: true,
        },
        orderBy: {
          timestamp: "desc",
        },
      });

      res.json(reciveData);
    } catch (error) {
      console.error("Error receiving Instagram data:", error);
      res.status(500).json({ message: "Error receiving data" });
    }
  },

  reciveDataInstagramPagination: async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const userId = req.user.userId;

    const skip = (page - 1) * limit;
    try {
      const [post, total] = await Promise.all([
        prisma.socialMediaPost.findMany({
          where: { userId },
          skip,
          take: limit,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            comments: true,
          },
        }),
        prisma.socialMediaPost.count({ where: { userId } }),
      ]);
      const response = {
        data: post,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      res.json(response);
    } catch (error) {
      console.error("Error receiving Instagram Pagination data:", error);
      res.status(500).json({ message: "Error receiving data" });
    }
  },
};

module.exports = instagramDataController;

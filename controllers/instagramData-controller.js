const { prisma } = require("../prisma/prisma-client");
const { fetchInstagramDataAfterLogin } = require("./instagram-controller");

// Simple in-memory storage for access tokens
const userTokens = new Map();

const instagramDataController = {
  // Legacy function - keep for compatibility (not used anymore since we save in DB)
  storeUserToken: (userId, accessToken) => {
    console.log(`Legacy storeUserToken called for user ${userId} - now saving in database instead`);
  },

  refreshInstagramData: async (req, res) => {
    try {
      const userId = req.user.userId; 
      console.log(`Reload: userId = ${userId} (type: ${typeof userId})`);
      
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { facebookToken: true }
      });

      if (!user || !user.facebookToken) {
        console.log(`Reload: Facebook токен не знайдено для userId ${userId}`);
        return res.status(400).json({ 
          message: "Facebook access token не знайдено в базі даних. Увійдіть через Facebook знову." 
        });
      }

      const accessToken = user.facebookToken;
      console.log(`Reload: Facebook токен знайдено в БД = ${!!accessToken}`);

      console.log(`Reload: Викликаю fetchInstagramDataAfterLogin(${userId}, accessToken)`);

      await fetchInstagramDataAfterLogin(userId, accessToken);

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

const { prisma } = require("../prisma/prisma-client");

const reviewsController = {

  postReviews: async (req, res) => {
    try {
      const { messages, typeOfReviews, topic } = req.body;
      const userId = req.user.userId;

      if (!messages || !typeOfReviews) {
        return res
          .status(400)
          .json({ error: "Повідомлення та тип відгуку є обов'язковими" });
      }

      if (!userId) {
        return res.status(400).json({ error: "Користувач не знайдений" });
      }

      const createdAt = new Date().toISOString();

      const newReviews = await prisma.reviews.create({
        data: {
          userId,
          messages,
          typeOfReviews,
          createdAt,
          topic,
        },
      });

      res.json({ newReviews });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Помилка під час створення відгуку" });
    }
  },

  getAllReviews: async (req, res) => {
    try {
      const reviews = await prisma.reviews.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      });

      res.json({ reviews });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Помилка під час отримання відгуків" });
    }
  },

  getPaginationsReviws: async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    try {
      const [posts, total] = await Promise.all([
        prisma.reviews.findMany({
          skip,
          take: limit,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            user: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
          },
        }),
        prisma.reviews.count(),
      ]);

      const response = {
        data: posts,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      res.json(response);
    } catch (error) {
      console.error("Error occurred in getPaginationsReviws:", error);
      res.status(500).json({ error: "error download reviews" });
    }
  },
};

module.exports = reviewsController;

const { prisma } = require("../prisma/prisma-client");

const instagramDataController = {
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

    const skip = (page - 1) * limit;
    try {
      const [post, total] = await Promise.all([
        prisma.socialMediaPost.findMany({
          skip,
          take: limit,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            comments: true,
          },
        }),
        prisma.socialMediaPost.count(),
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

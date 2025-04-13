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
};

module.exports = instagramDataController;

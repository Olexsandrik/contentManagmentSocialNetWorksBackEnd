const { prisma } = require("../prisma/prisma-client");

const analyticsAI = {
  getMessage: async (req, res) => {
    try {
      const { userId } = req.query;

      if (!userId || isNaN(userId)) {
        return res
          .status(400)
          .json({ message: "передайте валідний userId в query" });
      }

      const createMessages = await prisma.analyticsAI.findMany({
        where: {
          userId: Number(userId),
        },
        select: {
          result: true,
          customPrompt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      console.log(createMessages);
      res.json(createMessages);
    } catch (error) {
      console.error("GET analytics error:", error);
      res.status(500).json({ message: "Помилка при отриманні аналітики" });
    }
  },
  removeDataAI: async (req, res) => {
    try {
      const { userId } = req.body;

      const removeData = await prisma.analyticsAI.deleteMany({
        where: {
          userId,
        },
      });

      res.json({ removeData });
    } catch (error) {
      console.error("Remove analytics error:", error);
      res.status(500).json({ message: "Помилка в увидалені даних" });
    }
  },
};
module.exports = analyticsAI;

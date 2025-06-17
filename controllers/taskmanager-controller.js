const { prisma } = require("../prisma/prisma-client");

const ToDoController = {
  addTask: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { name, priority, date, desc } = req.body;

      const add = await prisma.task.create({
        data: {
          name,
          priority,
          desc,
          date,
          userId,
        },
      });

      res.status(201).json(add);
    } catch (err) {
      console.error(err);
      res.status(500).json({ eror: "server error" });
    }
  },

  getTask: async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    try {
      const userId = req.user.userId;
      const [userTask, total] = await Promise.all([
        prisma.task.findMany({
          where: { userId },
          skip,
          take: limit,
          orderBy: {
            createdAt: "desc",
          },
        }),
        prisma.task.count({ where: { userId } }),
      ]);
      const response = {
        data: userTask,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      res.json(response);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "server error" });
    }
  },

  updateTask: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, priority, date, desc } = req.body;

      if (!id) {
        return res.status(400).json({ message: "Завдання не існує" });
      }

      console.log(name, priority, date, desc);

      const updatetask = await prisma.task.update({
        where: { id },
        data: { name, priority, date, desc },
      });

      res.status(200).json(updatetask);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "server error" });
    }
  },

  getAllTaskUser: async (req, res) => {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(400).json({ message: "користувача з таки id немає" });
    }

    const findTask = await prisma.task.findMany({
      where: {
        userId,
      },
    });

    if (!findTask) {
      return res.status(400).json({ message: "завдання не знайдені" });
    }

    res.status(201).json(findTask);
  },
  removeTask: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "завдання не існує з таки id" });
      }

      const task = await prisma.task.findUnique({
        where: { id },
      });

      if (!task) {
        return res.status(400).json({ message: "завдання не знайдено" });
      }

      const removetask = await prisma.task.delete({
        where: { id },
      });
      res.status(201).json(removetask);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "server error" });
    }
  },
};
module.exports = ToDoController;

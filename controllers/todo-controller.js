const { prisma } = require("../prisma/prisma-client");

const ToDoController = {
  addTask: async (req, res) => {
    try {
      const { userId, date, content } = req.body;

      if (!userId || !date || !content) {
        return res.status(400).json({ message: "Заповніть всі поля" });
      }
      const addtask = await prisma.toDo.create({
        data: {
          userId,
          date: new Date(date),
          content,
        },
      });
      res.status(201).json(addtask);
    } catch (err) {
      console.error(err);
      res.status(500).json({ eror: "server error" });
    }
  },

  getTask: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ message: "Користувач не має задачі" });
      }

      const gettask = await prisma.toDo.findMany({
        where: { userId: id },
      });
      res.status(201).json(gettask);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "server error" });
    }
  },

  updateTask: async (req, res) => {
    try {
      const { id } = req.params;
      const { content, completed, date } = req.body;

      if (!id) {
        return res.status(400).json({ message: "Завдання не існує" });
      }

      const updatetask = await prisma.toDo.update({
        where: { id },
        data: { content, completed: Boolean(completed), date },
      });

      res.status(200).json(updatetask);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "server error" });
    }
  },

  removeTask: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "завдання не існує з таки id" });
      }

      const task = await prisma.toDo.findUnique({
        where: { id },
      });

      if (!task) {
        return res.status(400).json({ message: "завдання не знайдено" });
      }
      // await prisma.toDo.deleteMany({
      //   data: { content, completed: Boolean(completed), date },
      // });
      const removetask = await prisma.toDo.delete({
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

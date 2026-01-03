const { prisma } = require("../prisma/prisma-client");

const ToDoController = {
	addTask: async (req, res) => {
		try {
			const userId = req.user.userId;
			const { name, priority, date, desc } = req.body;

			// Basic validation
			if (!name || !priority || !date) {
				return res.status(400).json({
					error: "Обов'язкові поля: name, priority, date",
				});
			}

			const datacoolest = await prisma.task.create({
				data: {
					name: name.trim(),
					priority,
					desc: desc?.trim() || null,
					date: new Date(date),
					userId,
				},
			});

			res.status(201).json({
				message: "Завдання успішно створено",
				data: datacoolest,
			});
		} catch (err) {
			console.error("Error adding task:", err);
			res.status(500).json({
				error: "Помилка сервера при створенні завдання",
			});
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

			console.log("Update Task Debug:");
			console.log("ID from params:", id);
			console.log("Body data:", { name, priority, date, desc });

			if (!id || id === "undefined") {
				return res.status(400).json({
					message: "ID завдання не вказаний або невірний",
					receivedId: id,
				});
			}

			// Check if task exists and belongs to user
			const userId = req.user.userId;
			const existingTask = await prisma.task.findFirst({
				where: {
					id: id,
					userId: userId,
				},
			});

			if (!existingTask) {
				return res.status(404).json({
					message: "Завдання не знайдено або не належить користувачу",
					taskId: id,
					userId: userId,
				});
			}

			// Build update data - only include fields that are provided
			const updateData = {};
			if (name !== undefined) updateData.name = name;
			if (priority !== undefined) updateData.priority = priority;
			if (date !== undefined) updateData.date = new Date(date);
			if (desc !== undefined) updateData.desc = desc;

			console.log("Update data:", updateData);

			const updatetask = await prisma.task.update({
				where: { id },
				data: updateData,
			});

			res.status(200).json({
				message: "Завдання успішно оновлено",
				data: updatetask,
			});
		} catch (err) {
			console.error("Error updating task:", err);
			if (err.code === "P2025") {
				return res.status(404).json({
					message: "Завдання з таким ID не знайдено",
					taskId: req.params.id,
				});
			}
			res.status(500).json({
				message: "Помилка сервера при оновленні завдання",
				error: err.message,
			});
		}
	},

	getAllTaskUser: async (req, res) => {
		try {
			const userId = req.user.userId;

			if (!userId) {
				return res
					.status(400)
					.json({ message: "користувача з таким id немає" });
			}

			const findTask = await prisma.task.findMany({
				where: {
					userId,
				},
				orderBy: {
					createdAt: "desc",
				},
			});

			// findMany returns an array, so check length, not null
			if (findTask.length === 0) {
				return res.status(200).json({
					message: "У користувача немає завдань",
					data: [],
				});
			}

			res.status(200).json({
				message: "Завдання успішно отримано",
				data: findTask,
				total: findTask.length,
			});
		} catch (err) {
			console.error("Error getting all user tasks:", err);
			res.status(500).json({
				message: "Помилка сервера при отриманні завдань",
			});
		}
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

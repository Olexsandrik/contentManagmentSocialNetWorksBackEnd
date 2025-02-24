const { prisma } = require("../prisma/prisma-client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");

const Jdenticon = require("jdenticon");

const UserController = {
  register: async (req, res) => {
    // req запит res - response
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Всі поля обовязкові" });
    }

    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });

      if (existingUser) {
        return res.status(400).json({ error: "Користувач вже існує" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);

      const png = Jdenticon.toPng(name, 200); //
      const avatarName = `${name}_${Date.now()}.png`;
      const avatarPath = path.join(__dirname, "/../uploads", avatarName); // __dirname поточна папка
      fs.writeFileSync(avatarPath, png); // fs - модуль node.js з файловою системою, writeFileSync

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          avatarUrl: `/uploads/${avatarName}`,
        },
      });
      res.json(user);
    } catch (error) {
      console.error("Error in register", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  login: async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Всі поля обовязкові" });
    }
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(400).json({ error: "неправильний логін чи пароль" });
      }

      const valid = await bcrypt.compare(password, user.password); // перевірка паролю
      if (!valid) {
        return res.status(400).json({ error: "неправильний логін чи пароль" });
      }

      const token = jwt.sign({ userId: user.id }, process.env.SECRET_KEY); // це  ключ доступу для подальшої

      res.json({ token });
    } catch (error) {
      console.error("Login error", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  getUserById: async (req, res) => {
    const { id } = req.params; // id користувача якого хочемо знайти
    const userId = req.user.userId; // беремо користувача якого записали

    try {
      const user = await prisma.user.findUnique({
        // знахоидть унікальний запис
        where: { id },
        include: {
          followers: true, // prisma це спрощує роботу з базою даних. followers список людей які підписані на цього користувача
          following: true, // following список людей на яких підписаний цей користувач
        },
      });
      if (!user) {
        return res.status(404).json({ error: "Користувач не знайдений" });
      }
      const isFollowing = await prisma.follows.findFirst({
        // isFollowing це логіка чи підписаний тепершній користувач на користувача якого ми шукаємо
        where: {
          AND: [{ followerId: userId }, { followingId: id }], // корисно для показу підписників користувача
        },
      });

      res.json({ ...user, isFollowing: isFollowing });
    } catch (error) {
      console.error("Get Current Error", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  updateUser: async (req, res) => {
    const { id } = req.params;
    const { email, name, dateOfBirth, bio, location } = req.body;

    let filePath;
    if (req.file && req.file.path) {
      filePath = req.file.path;
    }
    if (id !== req.user.userId) {
      return res.status(403).json({ error: "немає доступу" });
    }
    try {
      if (email) {
        const existingUser = await prisma.user.findFirst({
          where: { email: email },
        });
        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ error: "пошта вже використовуєтсья" });
        }
      }

      const user = await prisma.user.update({
        where: { id },
        data: {
          email: email || undefined,
          name: name || undefined,
          avatarUrl: filePath ? `/${filePath}` : undefined,
          dateOfBirth: dateOfBirth || undefined,
          bio: bio || undefined,
          location: location || undefined,
        },
      });

      res.json(user);
    } catch (error) {
      console.error(error, "update error");
      res.status(500).json({ error: "Internal server error" });
    }
  },
  current: async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: req.user.userId,
        },
        include: {
          followers: {
            include: {
              follower: true,
            },
          },
          following: {
            include: {
              following: true,
            },
          },
        },
      });
      if (!user) {
        return res.status(400).json({ error: "невдалося найти користувача" });
      } else {
        res.json(user);
      }
    } catch (error) {
      console.error("Get current error", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};
module.exports = UserController;

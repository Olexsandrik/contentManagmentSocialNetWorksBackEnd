const express = require("express"); // фрейм для node.js
const router = express.Router(); // обєкт для роботи маршрутів
const passport = require("passport");
const jwt = require("jsonwebtoken");
require("../controllers/facebook-controller");

const multer = require("multer"); //це бібліотека, яка допомагає приймати файли, що завантажуються клієнтом через HTTP-запит (наприклад, через форму на веб-сторінці).

const authenticateToken = require("../middleware/auth");
const UserController = require("../controllers/user-controller");
const ToDoController = require("../controllers/todo-controller");
const uploadDestination = "uploads";

// показуємо  де зберігати файли

const storage = multer.diskStorage({
  destination: uploadDestination,
  filename: function (req, file, cb) {
    cb(null, file.originalname); //
  },
});

const uploads = multer({ storage: storage }); //
// route user
router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.get("/current", authenticateToken, UserController.current);
router.get("/users/:id", authenticateToken, UserController.getUserById);
router.put(
  "/users/:id",
  authenticateToken,
  uploads.single("avatar"),
  UserController.updateUser
);
// route toDo
router.post("/todo", authenticateToken, ToDoController.addTask);
router.get("/todo/:id", authenticateToken, ToDoController.getTask);
router.delete("/todo/:id", authenticateToken, ToDoController.removeTask);
router.put("/todo/:id", authenticateToken, ToDoController.updateTask);
//route toDO

router.get(
  "/login/facebook",
  passport.authenticate("facebook", {
    scope: ["email", "public_profile", "pages_show_list", "instagram_basic"],
    session: false,
  })
);

router.get(
  "/login/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: "/login-failure",
    session: false,
  }),
  async (req, res) => {
    if (!req.user) {
      return res.redirect(`${process.env.CLIENT_URL}/login-failure`);
    }

    const token = jwt.sign({ userId: req.user.id }, process.env.SECRET_KEY, {
      expiresIn: "7d",
    });

    res.redirect(`${process.env.CLIENT_URL}/login/success?token=${token}`);
  }
);

module.exports = router;

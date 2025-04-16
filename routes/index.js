const express = require("express"); // фрейм для node.js
const router = express.Router(); // обєкт для роботи маршрутів
const passport = require("passport");
const jwt = require("jsonwebtoken");
require("../controllers/instagram-controller");

const multer = require("multer"); //це бібліотека, яка допомагає приймати файли, що завантажуються клієнтом через HTTP-запит (наприклад, через форму на веб-сторінці).

const authenticateToken = require("../middleware/auth");
const UserController = require("../controllers/user-controller");
const ToDoController = require("../controllers/todo-controller");
const reviewsController = require("../controllers/reviews-controller");
const instagramDataController = require("../controllers/instagramData-controller");
const getAdviceFromChatGPT = require("../controllers/chatgpt-controller");
const analyticsAI = require("../controllers/analyticsAI-controller");
const uploadDestination = "uploads";
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDestination);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname); // отримуємо розширення
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
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

//Reviews
router.get("/reviews-paginations", reviewsController.getPaginationsReviws);
router.post("/reviews", authenticateToken, reviewsController.postReviews);
router.get("/getreviews", reviewsController.getAllReviews);
//Reviews
//Data from  instagram
router.get(
  "/instagram-data",
  authenticateToken,
  instagramDataController.reciveDataInstagram
);
//Data from  instagram

//AI controller
router.post("/advice", authenticateToken, getAdviceFromChatGPT.adviceChatGpt);
router.get("/prompt/:userId", authenticateToken, analyticsAI.getMessage);
router.delete("/prompt/:id", authenticateToken, analyticsAI.removeDataAI);
//AI controller

router.get(
  "/login/facebook",
  passport.authenticate("facebook", {
    scope: [
      "email",
      "pages_show_list",
      "pages_read_engagement",
      "instagram_basic",
      "instagram_manage_insights",
      "instagram_manage_comments",
    ],

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

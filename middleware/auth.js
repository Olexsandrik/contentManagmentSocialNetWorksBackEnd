const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // отримуємо токен із хедера
  // якщо токен authHeader === Bearer abc123xyz456(наприклад) то виводиться
  //authHeader.split(" ")[1]; а саме abc123xyz456

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "invalid token" });
    }
    req.user = user;

    next(); // функція для наступного middleware або маршруту
  });
};

module.exports = authenticateToken;

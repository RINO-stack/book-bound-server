const jwt = require('jsonwebtoken');

const jwtSecretKey = process.env.JWT_SECRET_KEY || 'your_jwt_secret_key';

const verifyAdminToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Extract token from Authorization header

  if (!token) {
    return res.status(401).send({ message: "Unauthorized: No token provided" });
  }

  jwt.verify(token, jwtSecretKey, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden: Invalid token" });
    }

    if (decoded.role !== "admin") {
      return res.status(403).send({ message: "Forbidden: Admin access required" });
    }

    req.user = decoded; // Store decoded user info in `req.user`
    next(); // Proceed to the next middleware
  });
};

module.exports = verifyAdminToken;

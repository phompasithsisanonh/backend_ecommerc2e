const JWT = require("jsonwebtoken");
const authMiddlewares = (req, res, next) => {
  const { accessToken } = req.cookies;

  if (!accessToken) {
    return res.status(401).json({
      success: false,
      message: `please login to access this route ${accessToken} console.log(${process.env.TOKEN_SECRET})`,
    });
  } else {
    try {
      const decode = JWT.verify(accessToken, process.env.TOKEN_SECRET);
      req.role = decode.role;
      req.id = decode._id;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
};
module.exports.authMiddlewares = authMiddlewares;

const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {

  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'No token'
    });
  }

  try {

    const token = authHeader.replace('Bearer ', '');

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!decoded.id || decoded.role || decoded.purpose) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    req.user = decoded;

    next();

  } catch (error) {

    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};
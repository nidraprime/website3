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

    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden'
      });
    }

    req.admin = decoded;

    next();

  } catch (error) {

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

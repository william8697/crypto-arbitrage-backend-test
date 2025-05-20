// middleware/admin.js
module.exports = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      message: 'You do not have permission to perform this action'
    });
  }
  next();
};
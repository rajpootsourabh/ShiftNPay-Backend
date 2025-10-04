const jwt = require('jsonwebtoken');
const Model = require("../model/index");
const ObjectId = require("mongodb").ObjectId;

const tokenBlacklist = new Set();

const socketAuthMiddleware = (...roles) => {
  return async (socket, next) => {

    try {
      const authHeader = socket.handshake.headers['authorization'];
      if (!authHeader) {
        throw new Error('No authorization header');
      }
      const token = authHeader.replace(/bearer|jwt/i, "").trim();
      if (!token) {
        throw new Error('Authentication error: No token found');
      }

      if (tokenBlacklist.has(token)) {
        throw new Error('Authentication error: Token is blacklisted');
      }
      console.log(token,'token')
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.SECRET);
      } catch (err) {
        throw new Error('Invalid token');
      }
      let user = await Model.UserModel.findById(new ObjectId(decoded.result._id));
      if (!user) {
        user = await Model.EmployeeModel.findById(new ObjectId(decoded.result._id));

      }
      if (!user) {
        throw new Error('User not found');
      }

      socket.user = user.toJSON(); // Attach authenticated user to socket
      next();
    } catch (error) {
      console.error('Authentication error:', error.message);
      socket.emit('errorEvent', { message: error.message });
      return;
    }
  };
};

module.exports = { socketAuthMiddleware };
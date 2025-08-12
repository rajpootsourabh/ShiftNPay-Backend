const jwt = require('jsonwebtoken');
const Employer = require('../model/User');
const Employee = require('../model/Employee');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, process.env.SECRET);
    
    // Try to find the user in Employer collection first
    const employer = await Employer.findOne({
      _id: decoded.result._id
    });

    if (employer) {
      req.token = token;
      req.user = employer;
      req.userType = 'employer';
      return next();
    }

    // If not found in Employer, try Employee collection
    const employee = await Employee.findOne({
      _id: decoded.result._id
    });

    if (employee) {
      req.token = token;
      req.user = employee;
      req.userType = 'employee';
      return next();
    }

    // If not found in either collection
    throw new Error('User not found');
    
  } catch (err) {
    console.error('Authentication error:', err.message);
    res.status(401).send({ error: 'Please authenticate' });
  }
};

// Middleware to ensure employer access
const employer = async (req, res, next) => {
  try {
    await auth(req, res, () => {});
    if (req.userType !== 'employer') {
      return res.status(403).send({ error: 'Employer access required' });
    }
    next();
  } catch (err) {
    res.status(401).send({ error: 'Please authenticate' });
  }
};

// Middleware to ensure employee access
const employee = async (req, res, next) => {
  try {
    await auth(req, res, () => {});
    if (req.userType !== 'employee') {
      return res.status(403).send({ error: 'Employee access required' });
    }
    next();
  } catch (err) {
    res.status(401).send({ error: 'Please authenticate' });
  }
};

module.exports = {
  auth,
  employer,
  employee
};
const jwt = require('jsonwebtoken');
const { ErrorResponse } = require('./errorHandler');
const User = require('../models/User');
require('dotenv').config();

// Protect routes middleware
exports.protect = async (req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {

        // Extract token from Bearer token in header
        token = req.headers.authorization.split(' ')[1];

     
        // Extract token from Bearer token in header
        token = req.headers.authorization.split(' ')[1];
      

    } else if (req.cookies && req.cookies.token) {
        // Or get from cookie
        token = req.cookies.token;
    }

    // Check if token exists
    if (!token) {

        return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);


        // Get user from the token
        req.user = await User.findById(decoded.id);


       
        // Get user from the token
        req.user = await User.findById(decoded.id);
      


        if (!req.user) {
            return next(new ErrorResponse('User not found', 404));
        }

        next();
    } catch (err) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {

            return next(new ErrorResponse('User not found', 404));
        }

        if (!roles.includes(req.user.role)) {

            return next(
                new ErrorResponse(
                    `User role ${req.user.role} is not authorized to access this route`,
                    403
                )
            );
        }
        next();
    };
}; 
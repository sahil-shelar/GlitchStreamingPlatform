import { asyncHandler } from "../utils/asyncHandler.js"; // Importing asyncHandler utility function to handle async functions with error handling
import { User } from "../models/user.model.js"; // Importing the User model to interact with user data
import jwt from "jsonwebtoken"; // Importing the jsonwebtoken library for working with JSON Web Tokens (JWT)
import { ApiError } from "../utils/ApiError.js"; // Importing custom ApiError class for standardized API error responses

// Middleware function to verify JWT token
export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        // Extracting token from cookies or Authorization header, as when user requests it also contains jwt token
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        // If token is missing, return Unauthorized response
        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Verifying the JWT token using the secret key stored in environment variable
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Finding user in database based on _id from decoded JWT payload
        const user = await User.findById(decodedToken._id).select("-password -refreshToken");

        // If user not found, return Invalid Access Token response
        if (!user) {
            return res.status(401).json({ message: "Invalid Access Token" });
        }

        // Attach user object to request object for further middleware or route handling
        req.user = user;

        // Call next middleware or route handler
        next();
    } catch (error) {
        // If any error occurs during JWT verification or database query, throw ApiError
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});

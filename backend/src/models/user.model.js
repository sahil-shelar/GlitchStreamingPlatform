import mongoose, { Schema } from "mongoose"; // Import mongoose and Schema from mongoose
import jwt from "jsonwebtoken"; // Import jsonwebtoken for generating JWT tokens
import bcrypt from "bcrypt"; // Import bcrypt for hashing passwords

// Define the user schema
const userSchema = new Schema({
    username: {
        type: String, // The username must be a string
        required: true, // The username is required
        unique: true, // The username must be unique
        lowerCase: true, // The username will be stored in lowercase
        trim: true, // Remove whitespace from both ends of the username
        index: true // Index the username field for faster queries
    },
    email: {
        type: String, // The email must be a string
        required: true, // The email is required
        unique: true, // The email must be unique
        lowerCase: true, // The email will be stored in lowercase
        trim: true // Remove whitespace from both ends of the email
    },
    fullName: {
        type: String, // The full name must be a string
        required: true, // The full name is required
        trim: true, // Remove whitespace from both ends of the full name
        index: true // Index the full name field for faster queries
    },
    avatar: {
        type: String, // The avatar URL must be a string
        required: true // The avatar is required
        // cloudinary service is used, where we can store images and videos for free
    },
    coverImage: {
        type: String // The cover image URL must be a string
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId, // Each item in watch history references a Video document
            ref: "Video" // Reference the "Video" model
        }
    ],
    password: {
        type: String, // The password must be a string
        required: [true, "Password is required"] // The password is required with a custom error message
    },
    refreshToken: {
        type: String // The refresh token must be a string
    }
},
{
    timestamps: true // Automatically add createdAt and updatedAt fields
});

// Middleware to hash the password before saving the user
// Instance Method, defines an instance method that can be called on any instance of the User model
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next(); // If the password is not modified, skip hashing
    this.password = await bcrypt.hash(this.password, 10); // Hash the password with a salt round of 10
    next(); // Proceed to the next middleware or save operation
});

// Method to check if the provided password is correct
userSchema.methods.isPasswordCorrect = async function(password) {
    console.log(password, this.password)
    return await bcrypt.compare(password, this.password); // Compare the provided password with the stored hashed password
};

// Method to generate an access token
userSchema.methods.generateAccessToken = function() {
    return jwt.sign({
        _id: this.id, // Include the user ID in the token payload
        email: this.email, // Include the email in the token payload
        username: this.username, // Include the username in the token payload
        fullName: this.fullName // Include the full name in the token payload
    },
    process.env.ACCESS_TOKEN_SECRET, // Use the secret key from environment variables
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY // Set the token expiry time from environment variables
    });
};

// Method to generate a refresh token
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign({
        _id: this.id, // Include the user ID in the token payload
        email: this.email, // Include the email in the token payload
        username: this.username, // Include the username in the token payload
        fullName: this.fullName // Include the full name in the token payload
    },
    process.env.REFRESH_TOKEN_SECRET, // Use the secret key from environment variables
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY // Set the token expiry time from environment variables
    });
};

// Create the User model from the schema and export it
export const User = mongoose.model("User", userSchema);








/* Explanation
- **Imports:**
  - `mongoose` and `Schema`: Used to define and work with MongoDB schemas and models.
  - `jsonwebtoken`: Used for creating and verifying JWT tokens.
  - `bcrypt`: Used for hashing and comparing passwords.

- **Schema Definition:**
  - `userSchema`: Defines the structure and rules for the User model, including fields like `username`, `email`, `fullName`, `avatar`, `coverImage`, `watchHistory`, `password`, and `refreshToken`.
  - **Fields**: Each field in the schema has specific attributes, such as type, required, unique, and other constraints.

- **Middleware:**
  - `pre("save")`: Middleware that runs before a user is saved. It hashes the password if it has been modified.

- **Instance Methods:**
  - `isPasswordCorrect`: Compares a provided password with the stored hashed password.
  - `generateAccessToken`: Creates a JWT access token with user information.
  - `generateRefreshToken`: Creates a JWT refresh token with user information.

- **Export:**
  - `User`: The model created from the schema, which can be used to interact with the User collection in MongoDB.
*/
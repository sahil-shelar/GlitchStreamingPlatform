import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId)=>{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
        
    } catch (error) {
        throw new ApiError(500,`Something went while generating refresh and access tokens ${error}`)
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from user
    // validation to check if data is not absent or incorrect
    // check if user already exist : username or email
    // check for images and check for avatar
    // upload them to cloudinary
    // create user object -  create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response

    const {fullName, email, username, password} = req.body
    // console.log({"email": email});

    // if(fullName===""){
    //     throw new ApiError(400, "Full name is required")
    // }

    if (
        [fullName, email, username, password].some((field)=> field?.trim()==="")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or:[{username},{email}],
    })

    if(existedUser){
        throw new ApiError(409, "Username or Email already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    // let coverImageLocalPath;
    // if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    //     coverImageLocalPath = req.files.coverImage[0].path
    // }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar upload failed")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "", // default to empty string
        email,
        password,
        username: username.toLowerCase(),
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Failed to create user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {

    /*
    Todo's for login:
  
    - Take input from the user from the login page.
    - Save it in a variable.
    - Apply checks to verify the provided username and password.
    - Call MongoDB to check if there is any user with the same username (or email).
    - If the user does not exist, throw an error and possibly redirect to the register page.
    - If the user exists, retrieve their _id and other details.
    - Verify the password.
    - If the credentials are valid, redirect to the desired page.
    */
  
    // Extract email, username, and password from the request body
    const { email, username, password } = req.body;
  
    // Check if email or username is provided; if not, throw an error
    if (!(email || username)) {
      throw new ApiError(400, "Please provide email or username");
    }
  
    // Search the database for a user with the provided email or username
    const user = await User.findOne({
      $or: [{ email }, { username }]
    });
  
    // If the user does not exist, throw an error
    if (!user) {
      throw new ApiError(404, "User does not exist");
    }
  
    // Verify if the provided password matches the stored password
    const isPasswordValid = await user.isPasswordCorrect(password);
  
    // If the password is incorrect, throw an error
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid Credentials");
    }
  
    // Generate access and refresh tokens for the authenticated user
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
  
    // Retrieve the user details without password and refresh token
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
  
    // Set options for the cookies to be secure and HTTP only
    const options = {
      httpOnly: true,
      secure: true
    };
  
    // Send the response with cookies containing the tokens and the user data
    return res.status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(200, {
          user: loggedInUser,
          accessToken,
          refreshToken
        },
        "User logged in successfully"
        )
      );
})
  
const logOutUser = asyncHandler(async(req,res) =>{
    await User.findByIdAndUpdate(req.user._id,{
        $unset:{
            refreshToken: 1
        }
    },
    {
        new: true
    })

    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out successfully"))

})

const refreshAccessToken = asyncHandler(async(req,res) =>{
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized Request")
    }

   try {
     const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
 
     const user = await User.findById(decodedToken?._id)
 
     if(!user){
         throw new ApiError(401,"Invalid refresh token")
     }
 
     if(incomingRefreshToken !== user?.refreshToken){
         throw new ApiError(401,"Refresh token is expired or used")
     }
 
     const options = {
         httpOnly : true,
         secure : true
     }
 
     const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
 
     return res.status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken",newRefreshToken,options)
     .json(new ApiResponse(200,{
         accessToken,refreshToken:newRefreshToken},
         "Access token refreshed successfully"))
   } catch (error) {
        throw new ApiError(401,error?.message || "invalid refresh token")
   }
})

const changeCurrentPassword = asyncHandler(async(req,res) =>{
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(401,"Old password is incorrect")
    }

    user.password = newPassword
    await user.save({
        validateBeforeSave: false
    })

    return res.status(200)
    .json(new ApiResponse(200,user,"Password changed successfully"))

})

const getCurrentUser = asyncHandler(async(req,res) =>{
    return res.status(200)
    .json(new ApiResponse(200,req.user,"Current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res) =>{
    const {fullName, email} = req.body

    if(!(fullName || email)){
        throw new ApiError(400,"Please provide at least one field to update")
    }

    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                fullName,
                email
            }
        },
        {
            new: true
        }).select("-password")

    return res.status(200)
    .json(new ApiResponse(200,user,"Account Details Updated"))

})

const updateUserAvatar = asyncHandler(async(req,res) =>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Please upload an avatar")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(500,"Failed to upload avatar")
    }

    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    )
    
    return res.status(200)
    .json(new ApiResponse(200,user,"Cover Image updated successfully"))

})

const updateUserCoverImage = asyncHandler(async(req,res) =>{

    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "Please upload an cover image")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(500,`Failed to upload cover image ${error}`)
    }

    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                avatar: coverImage.url
            }
        },
        {
            new: true
        }
    )

    return res.status(200)
    .json(new ApiResponse(200,user,"Cover Image updated successfully"))

})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params

    if(!params?.trim()){
        throw new ApiError(400,"Username is missing")
    }

    const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size: "$subscribers"
                },
                channelsSubscribedToCount:{
                    $size: "$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        $if:{$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404,"Channel does not exist")
    }

    return res.status(200)
    .json(new ApiResponse(200,channel[0],"User channel fethched"))

})

const getWatchHistory = asyncHandler(async(req,res) =>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
          $lookup: {
            from: "videos",
            localField: "watchHistory",
            foreignField: "_id",
            as: "watchHistory",
            pipeline:[
                {
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline:[
                            {
                                $project: {
                                    fullName: 1,
                                    username: 1,
                                    avatar: 1,
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields: {
                        owner: {
                            $first: "$owner"
                        }
                    }
                }
            ]
          }  
        },
        {

        },{}
    ])

    return res.status(200)
    .json(new ApiResponse(200,user[0].watchHistory,"Watch history fetched"))
})


export {registerUser, 
    loginUser, 
    logOutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
};



/*
Detailed Comments and Advanced Syntax Explanation:
1. Import Statements:
- import { asyncHandler } from "../utils/asyncHandler.js";: Import a utility to handle asynchronous operations and catch errors.
- import { ApiError } from "../utils/ApiError.js";: Import a custom error class to handle API errors.
- import { ApiResponse } from "../utils/ApiResponse.js";: Import a class to standardize API responses.
- import { User } from "../models/user.model.js";: Import the User model for interacting with the database.
- import { uploadOnCloudinary } from "../utils/cloudinary.js";: Import a function to upload images to Cloudinary.

2. Extracting and Validating User Details:
- const { fullName, email, username, password } = req.body;: Extract user details from the request body.
- if ([fullName, email, username, password].some((field) => field?.trim() === "")) { ... }: Check if any required field is missing or empty using Array.prototype.some(). The optional chaining (?.) ensures that the code doesn't throw an error if field is null or undefined.

3. Checking for Existing Users:
- const existedUser = await User.findOne({ $or: [{ username }, { email }] });: Use MongoDB's $or operator to check if a user with the given username or email already exists.

4. Handling File Uploads:
- const avatarLocalPath = req.files?.avatar?.[0]?.path;: Use optional chaining (?.) to safely access nested properties. This ensures the code doesn't throw an error if any part of the path is undefined.
- const coverImageLocalPath = req.files?.coverImage?.[0]?.path;: Similar to above, safely accessing the cover image path.

5. Uploading to Cloudinary:
- const avatar = await uploadOnCloudinary(avatarLocalPath);: Upload the avatar image to Cloudinary and get the URL.
- const coverImage = await uploadOnCloudinary(coverImageLocalPath);: Upload the cover image to Cloudinary if provided.

6. Creating and Saving the User:
- const user = await User.create({ ... });: Create and save a new user in the database.
- const createdUser = await User.findById(user._id).select("-password -refreshToken");: Retrieve the newly created user,excluding the password and refresh token fields using Mongoose's select() method.

7. Returning the Response:
- return res.status(201).json(new ApiResponse(200, createdUser, "User Registered Successfully"));: Send a success response with the created user data, using a standardized API response format.


Todo's for login ( dnt know if its good )

- take input from the user from the login page.
- save it in a variable
- apply check ( as per js series form handling part ) if the username == username && password == password . Then perform some action.
- call mongodb to check the db if there is any user with the same username ( email in case ) is present or not , if not throw err . And redirect to register (dnt know how, will plan if situation arise)
-  if username/email present. Then get its _id and store it in variable 
- retreive username and pass from that variable to check if both are same or not. If no then err
- if yes then redirect it to the page we want 

*/
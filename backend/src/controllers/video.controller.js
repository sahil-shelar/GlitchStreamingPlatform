import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteOnCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"

// get all videos based on query, sort, pagination
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    // Define initial aggregation pipeline stages
    const pipeline = [];

    // Match stage: add filters based on query parameters
    if (query) {
        pipeline.push({
            $match: {
                $or: [
                    { title: { $regex: query, $options: 'i' } }, // Case-insensitive title search
                    { description: { $regex: query, $options: 'i' } } // Case-insensitive description search
                ]
            }
        });
    }

    if (!userId) {
        throw new ApiError(400, "Invalid userId");
    }

    pipeline.push(
        { 
            $match: { 
                owner: userId 
            } 
        }); // Filter by userId

    //sortBy can be views, createdAt, duration
    //sortType can be ascending(-1) or descending(1)
    if (sortBy && sortType) {
        pipeline.push({
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        });
    } else {
        pipeline.push({ $sort: { createdAt: -1 } });
    }

    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$ownerDetails"
        }
    )

    const videoAggregate = Video.aggregate(pipeline);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const video = await Video.aggregatePaginate(videoAggregate, options);

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Videos fetched successfully"));
});

const publishVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if([title, description].some(field =>field?.trim()==="")){
        throw new ApiError(400, "All fields are required")
    }

    const videoFileLocalPath = req.files?.videoFile[0].path    
    const thumbnailLocalPath = req.files?.thumbnail[0].path

    if(!(videoFileLocalPath && thumbnailLocalPath)){
        throw new ApiError(400, "Video or thumbnail is required")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath)

    if(!videoFile){
        throw new ApiError(400, "Video file upload failed")
    }

    if(!thumbnailFile){
        throw new ApiError(400, "Thumbnail file upload failed")
    }

    const video = await Video.create({
        title,
        description,
        videoFile:{
            url: videoFile.url,
            public_id: videoFile.public_id
        },
        duration: videoFile.duration,
        thumbnailFile:{
            url: thumbnailFile.url,
            public_id: thumbnailFile.public_id
        },
        owner: req.user._id,
        isPublished:false
    })

    const videoUploaded = await Video.findById(video._id)

    if(!videoUploaded){
        throw new ApiError(500, "Video upload failed")
    }

    return res(200)
    .json(new ApiResponse(200, video, "Video uploaded successfully"))

})

// get video by id
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    // let userId = req.body;
    
    // userId = new mongoose.Types.ObjectId(userId)
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    if (!isValidObjectId(req.user?._id)) {
        throw new ApiError(400, "Invalid userId");
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: {
                                $size: "$subscribers"
                            },
                            isSubscribed: {
                                $cond: {
                                    if: {
                                        $in: [
                                            req.user?._id,
                                            "$subscribers.subscriber"
                                        ]
                                    },
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1,
                            subscribersCount: 1,
                            isSubscribed: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                },
                owner: {
                    $first: "$owner"
                },
                isLiked: {
                    $cond: {
                        if: {$in: [req.user?._id, "$likes.likedBy"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                "videoFile.url": 1,
                title: 1,
                description: 1,
                views: 1,
                createdAt: 1,
                duration: 1,
                comments: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1
            }
        }
    ]);

    if (!video) {
        throw new ApiError(500, "failed to fetch video");
    }

    // increment views if video fetched successfully
    await Video.findByIdAndUpdate(videoId, {
        $inc: {
            views: 1
        }
    });

    // add this video to user watch history
    await User.findByIdAndUpdate(req.user?._id, {
        $addToSet: {
            watchHistory: videoId
        }
    });

    return res
        .status(200)
        .json(
            new ApiResponse(200, video[0], "video details fetched successfully")
        );
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title, description} = req.body
    //TODO: update video details like title, description, thumbnail

    if(!videoId){
        throw new ApiError(400, "video id is required")
    }

    if(!(title || description)){
        throw new ApiError(400, "title or description are required")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "video not found")
    }

    await deleteOnCloudinary(video.thumbnail)

    // const videoFileLocalPath = req.files?.videoFile[0]
    const thumbnailLocalPath = req.files?.thumbnail[0]

    // if(!videoFileLocalPath){
    //     throw new ApiError(400, "video file is required")
    // }
    if(!thumbnailLocalPath){
        throw new ApiError(400, "thumbnail file is required")
    }
    
    // const newVideoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnailfile = await uploadOnCloudinary(thumbnailLocalPath)

    if(!thumbnailfile.url){
        throw new ApiError(500, "thumbnail failed to upload")
    }

    // video.videoFile = newVideoFile.url

    const updatedVideo = await Video.findByIdAndUpdate(videoId,{
        $set:{
            title,
            description,
            thumbnail: thumbnailfile.url
        }},
        {
            new:true
        }
    )


    return res.status(200)
    .json(new ApiResponse(200, updatedVideo, "Details updated successfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if(!videoId){
        throw new ApiError(400, "videoId is required")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "video not found")
    }

    await deleteOnCloudinary(video.videoFile)
    await deleteOnCloudinary(video.thumbnail)

    const videoDeleted = await Video.findByIdAndDelete(video?._id)

    if(!videoDeleted){
        throw new ApiError(404, "video not found")
    }

    return res.status(200)
    .json(new ApiResponse(200,{}, "Video Deleted"))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(400, "videoId is required")
    }

    const video = await Video.findByIdAndUpdate(videoId,
        {
            $set:{
                isPublished: !video.isPublished
            }
        },
        { 
            new: true 
        }
    )

    if (!toggledVideoPublish) {
        throw new ApiError(500, "Failed to toogle video publish status");
    }

    return res.status(200)
    .json(new ApiResponse(200, video.isPublished, "Video publish toggled successfully"))

})

export {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}

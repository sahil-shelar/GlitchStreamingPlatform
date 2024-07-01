import mongoose, { Schema } from "mongoose"; // Import mongoose and Schema from mongoose
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"; // Import the pagination plugin for aggregate queries

// Define the video schema
const videoSchema = new Schema({
    videoFile: {
        type: String, // The video file URL must be a string
        required: true // The video file is required
    },
    thumbnail: {
        type: String, // The thumbnail image URL must be a string
        required: true // The thumbnail image is required
    },
    title: {
        type: String, // The title must be a string
        required: true // The title is required  
    },
    description: {
        type: String, // The description must be a string
        required: true // The description is required  
    },
    duration: {
        type: Number, // The duration of the video must be a number
        required: true // The duration is required  
    },
    views: {
        type: Number, // The number of views must be a number
        default: 0 // Default value for views is 0  
    },
    isPublished: {
        type: Boolean, // Indicates whether the video is published
        default: true // Default value for isPublished is true  
    },
    owner: {
        type: Schema.Types.ObjectId, // The owner field references a User document
        ref: "User" // Reference the "User" model  
    }
},
{
    timestamps: true // Automatically add createdAt and updatedAt fields
});

// Add pagination plugin to the schema
videoSchema.plugin(mongooseAggregatePaginate);

// Create the Video model from the schema and export it
export const Video = mongoose.model("Video", videoSchema);

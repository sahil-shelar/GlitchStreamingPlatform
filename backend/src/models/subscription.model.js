import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema({
    subscriber:{
        type: Schema.Types.ObjectId, //users subscribing the channel
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId, //chanell to which user subscribes
        ref: "User"
    }
},
{
    timestamps: true
})

export const Subscription = mongoose.model("Subscription", subscriptionSchema)
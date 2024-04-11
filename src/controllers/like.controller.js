import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import {Tweet} from "../models/tweet.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: toggle like on video
    //check if the videoId is the valid objectId

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid objectId");
    }

    const like = await Like.findOneAndUpdate(
        {
            videoId,
            owner: req.user?._id,
        },
        {
            $set: {
                videoId,
                owner: req.user?._id,
            },
            $inc: {
                liked: 1,
            },
        },
        {
            upsert: true, // This option indicates that if no documents match the query, a new document should be created based on the query and update operations. In this case, it ensures that if there is no existing Like document matching the given criteria, a new one will be created.
            new: true,
        }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, "Video Like toggled successfully", {
                liked: like.liked,
            })
        );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    //TODO: toggle like on comment

    if (!isValidObjectId(commentId)) {
        throw new ApiError(404, "Invalid commentId");
    }

    const comment = await Comment.findOneAndUpdate(
        {
            commentId,
            owner: req.user?._id,
        },
        {
            $set: {
                commentId,
                owner: req.user?.id,
            },
            $inc: {
                liked: 1,
            },
        },
        {
            upsert: true,
            new: true,
        }
    );

    if (!comment) {
        throw new ApiError(404, "Comment not found or user does not have comment")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, "Comment Like toggled successfully", {
                liked: comment.liked,
            })
        );
});


const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    console.log(tweetId);

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(404, "Invalid tweetId")
        
    }


    const tweet = await Tweet.findOneAndUpdate(
        {
            tweetId,
            owner: req.user?._id
        },
        {
            $set: {
                tweetId,
                owner: req.user?._id
            },
            $inc: {
                liked : 1
            }
        },
        {
            upsert: true,
            new : true
        }
    )

    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, "Tweet like toggled successfully", {liked: tweet.liked}))

});

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos.
    //Aggregation pipelines is here.
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };

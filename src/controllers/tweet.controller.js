import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;

    console.log(content);

    if (!content) {
        throw new ApiError(404, "Write something in content...");
    }

    // if (!req.user?._id) {
    //     throw new ApiError(404, "User not found")
        
    // }

    const tweet = await Tweet.create({
        content,
        owner: req.user?._id,
    });

    if (!tweet) {
        throw new ApiError(404, "Tweet didn't created");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    //Use aggregation pipelines
    //below is wrong.
    const { tweetId } = req.params;

    if (!tweetId) {
        throw new ApiError(404, "TweetId is required");
    }

    const tweet = await Tweet.findOne({
        tweetId,
        owner: req.user?._id,
    });

    if (!tweet) {
        throw new ApiError(404, "Tweet doesnt exists");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "User Tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!tweetId) {
        throw new ApiError(404, "TweetId is required");
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content,
            },
        },
        { new: true }
    );

    if (!updatedTweet) {
        throw new ApiError(404, "Tweet didnt updated ");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedTweet, "Tweet Updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;

    if (!tweetId) {
        throw new ApiError(404, "TweetId is required");
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

    if (!deletedTweet) {
        throw new ApiError(404, "Tweet didnt deleted");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Tweet deleted sucessfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };

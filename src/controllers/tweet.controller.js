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
        throw new ApiError(401, "Write something in content...");
    }

    try {
        
        const tweet = await Tweet.create({
            content,
            owner: req.user?._id,
        });
    
        if (!tweet) {
            throw new ApiError(401, "Tweet didn't created");
        }
    
        return res
            .status(200)
            .json(new ApiResponse(201, tweet, "Tweet created successfully"));
    } catch (error) {
        throw new ApiError(500 , 'Something went wrong while creating tweet')
    }
});

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    //Use aggregation pipelines
    //below is wrong.
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(200, "userId is invalid")
        
    }

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
            
        },
        {
            $lookup:{
                from: "users",
                localField:"owner",
                foreignField:"_id",
                as:"ownerDetails",

                pipeline: [
                    {
                        $project: {
                            username:1,
                            avatar: 1
                        }
                    }
                ]
                  
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"tweet",
                as:"likedDetails",

                pipeline:[
                    {
                        $project:{
                            likedBy:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                ownerDetails:{
                    $first: "$ownerDetails"
                },
                likesCount:{
                    $size: "$likesDetails"
                },
                isLiked:{
                    $cond: {
                        if: {$in: [req.user?._id, "$likeDetails.likedBy"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                content: 1,
                ownerDetails: 1,
                likesCount: 1,
                createdAt: 1,
                isLiked: 1
            },
        },


    ]);

    return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets fetched successfully"))
});



const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!tweetId) {
        throw new ApiError(404, "TweetId is required");
    }

    if (!content) {
        throw new ApiError(404, "content is required");
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

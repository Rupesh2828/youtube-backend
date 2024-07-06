import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import {Tweet} from "../models/tweet.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {  //working fine
    const { videoId } = req.params
  
    
    if(!isValidObjectId(videoId)) {
        throw new ApiError(401 , "video is not valid")
    }

    const likedVideos = await Like.findOne({video: videoId})

    if(likedVideos){

        const unlike =  await Like.deleteOne({ video : videoId})

       if(!unlike) {
        throw new ApiError(400 , "failed to unlike commet like")
    }
      return res.status(200).json(new ApiResponse(200, {}, "removed like"));

    } else {
       const  like = await Like.create({
            video: videoId,
            likeBy : req.user?._id
        })

        if(!like) {
            throw new ApiError(400 , " failed to like comment like")
        }

        await Like.create({
            video: videoId,
            likedBy: req.user?._id,
        });
        

        return res.status(200).json(new ApiResponse(200, likedVideos || [], "like video successfully!!"));
    }
});

const toggleCommentLike = asyncHandler(async (req, res) => {  //working fine
    const { commentId } = req.params;
    //TODO: toggle like on comment

    if (!isValidObjectId(commentId)) {
        throw new ApiError(404, "Invalid commentId");
    }

    const update = {
        $set: {
            owner: req.user?._id,
        },
        $inc: {
            liked: 1,
        },
    };

    // Find the existing Like document or create a new one if it doesn't exist
    const options = {
        upsert: true,  // This option indicates that if no documents match the query, a new document should be created based on the query and update operations. In this case, it ensures that if there is no existing Like document matching the given criteria, a new one will be created.
        new: true,
    };

    // Use findByIdAndUpdate to find and update the document by its _id
    const comment = await Like.findByIdAndUpdate(
        commentId, 
        update, 
        options 
    );

    if (!comment) {
        throw new ApiError(401,"Comment not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, "Comment Like toggled successfully", {
                liked: comment.liked,
            })
        );
});


const toggleTweetLike = asyncHandler(async (req, res) => {  //working fine
    const { tweetId } = req.params;
    console.log(tweetId);

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(404, "Invalid tweetId")
        
    }

    const update = {
        $set: {
            owner: req.user?._id,
        },
        $inc: {
            liked: 1,
        },
    };

    const options = {
        upsert: true,  // This option indicates that if no documents match the query, a new document should be created based on the query and update operations. In this case, it ensures that if there is no existing Like document matching the given criteria, a new one will be created.
        new: true,
    };

    // Use findByIdAndUpdate to find and update the document by its _id
    const tweet = await Like.findByIdAndUpdate(
        tweetId, 
        update, 
        options 
    );

    

    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, "Tweet like toggled successfully", {liked: tweet.liked}))

});

const getLikedVideos = asyncHandler(async (req, res) => {  //check this again
    const likedVideosAggegate = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideo",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails",
                        },
                    },
                    {
                        $unwind: "$ownerDetails",
                    },
                ],
            },
        },
        {
            $unwind: "$likedVideo",
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
        {
            $project: {
                _id: 0,
                likedVideo: {
                    _id: 1,
                    videoFile: 1,
                    thumbNail: 1,
                    owner: 1,
                    title: 1,
                    description: 1,
                    views: 1,
                    duration: 1,
                    createdAt: 1,
                    isPublished: 1,
                    ownerDetails: {
                        username: 1,
                        fullName: 1,
                        avatar: 1,
                    },
                },
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                likedVideosAggegate,
                "liked videos fetched successfully"
            )
        );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };

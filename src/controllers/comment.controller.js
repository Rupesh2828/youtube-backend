import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
    //commentId, videoId
    const {videoId} = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(401,"videoId id invalid")
        
    }

    const comments = await Comment.aggregate([
        {
            $match:{
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField:"owner",
                foreignField:"_id",
                as:"owner"
            }
        }
    ])

});

const addComment = asyncHandler(async (req, res) => {  //working fine
    // TODO: add a comment to a video
    const { content } = req.body;
    const { videoId } = req.params;

    if(!isValidObjectId(videoId)) {
        throw new ApiError(401 , "Invalid videoId")
    }

    if (!content) {
        throw new ApiError(404, "Content is required");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video does not found");
    }

    const comment = await Comment.create({
        content,
        video,
        owner: req.user?._id,
    });

    if (!comment) {
        throw new ApiError(404, "Comment not added");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {  //working fine
    // TODO: update a comment
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content) {
        throw new ApiError(200, "Content is required");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,

        {
            $set: {
                content,
            },
        },
        {
            new: true,
        }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedComment, "Comment updated successfully")
        );
});

const deleteComment = asyncHandler(async (req, res) => {  //working fine
    // TODO: delete a comment
    const {commentId} = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId)


    return res
    .status(200)
    .json(new ApiResponse(200, deletedComment, "Comment deleted successfully"))
});

export { getVideoComments, addComment, updateComment, deleteComment };

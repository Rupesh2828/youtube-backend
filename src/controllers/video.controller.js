import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {  //working fine asof now
    try {
        // Fetch all videos from the database
        const videos = await Video.find();

        // Return the videos as a response
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    videos,
                    "All videos retrieved successfully"
                )
            );
    } catch (error) {
        // If an error occurs, handle it and send an error response
        console.error("Error fetching videos:", error);
        return res
            .status(500)
            .json(
                new ApiResponse(
                    500,
                    null,
                    "An error occurred while fetching videos"
                )
            );
    }
});

const publishAVideo = asyncHandler(async (req, res) => { //working fine
    //working fine.
    const { title, description } = req.body;
    // TODO: get video, upload to cloudinary, create video

    if (!title || !description) {
        throw new ApiError(404, "Name and Description doesn't exists");
    }

    const user = await User.findOne(req.user?._id);

    if (!user) {
        throw new ApiError(404, "User doesn't exists");
    }

    const getVideoFilePath = req.files?.videoFile[0]?.path;
    const getThumbnailPath = req.files?.thumbnail[0]?.path;

    if (!getVideoFilePath || !getThumbnailPath) {
        throw new ApiError(404, "VideoFile and Thumbnail doesn't exists ");
    }

    const videoFile = await uploadOnCloudinary(getVideoFilePath);
    const thumbnail = await uploadOnCloudinary(getThumbnailPath);

    const video = await Video.create({
        title,
        description,
        videoFile: videoFile?.url,
        thumbnail: thumbnail?.url,
        duration: videoFile.duration,
        owner: req.user?._id,
        isPublished: true,
    });

    if (!video) {
        throw new ApiError(404, "Unable to publish a video");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
    //working fine
    const { videoId } = req.params;
    //TODO: get video by id

    if (!videoId) {
        throw new ApiError(404, "Video doesn't exists");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "User doesn't exists");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    //working fine.
    const { videoId } = req.params;
    const { title, description } = req.body;
    //TODO: update video details like title, description, thumbnail

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "videoId doesn't exist");
    }

    if (!(title || description)) {
        throw new ApiError(404, "Title and Description are required");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video doesn't exists");
    }

    // if (video?.owner.toString() !== req.user?._id.toString()) {
    //     throw new ApiError(
    //         400,
    //         "You can't edit this video as you are not the owner"
    //     );
    // }

    const deleteOldThumbnail = video.file ? video.file.public_id : null;

    const thumbnailLocalPath = req.file?.path;

    if (!thumbnailLocalPath) {
        throw new ApiError(404, "Thumbnail is required");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail) {
        throw new ApiError(400, "thumbnail not found");
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: thumbnail.url,
            },
        },
        {
            new: true,
        }
    );

    if (!updatedVideo) {
        throw new ApiError(404, "Video not updated");
    }

    if (updatedVideo) {
        await deleteOnCloudinary(deleteOldThumbnail);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => { //working fine
    const { videoId } = req.params;
    //TODO: delete video

    if (!videoId) {
        throw new ApiError(404, "Video doesn't exists");
    }

    const video = await Video.findByIdAndDelete(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    //working fine
    const { videoId } = req.params;

    // Find the video by ID
    const video = await Video.findById(videoId);

    // Check if the video exists
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            400,
            "You can't toogle publish status as you are not the owner"
        );
    }

    const toggledVideoPublish = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video?.isPublished,
            },
        },
        { new: true }
    );

    if (!toggledVideoPublish) {
        throw new ApiError(500, "Failed to toggle video publish status");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isPublished: toggledVideoPublish.isPublished },
                "Video publish toggled successfully"
            )
        );
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};

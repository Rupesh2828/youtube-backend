import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    // const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "videoOwnerDetails"
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, user, "All videos fetched successfully"))
})


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if (!title || !description) {
        throw new ApiError(404, "Name and Description doesn't exists")
    }

    const user = await User.findOne(req.user?._id)

    if (!user) {
        throw new ApiError(404, "User doesn't exists")
    }

    const getVideoFilePath = req.files.videoFile[0]?.path;
    const  getThumbnailPath = req.files?.thumbnail[0]?.path;

    if (!getVideoFilePath || !getThumbnailPath) {
        throw new ApiError(404, "VideoFile and Thumbnail doesn't exists ")
    }

    const videoFile = await uploadOnCloudinary(getVideoFilePath)
    const thumbnail = await uploadOnCloudinary(getThumbnailPath)

    const video = await Video.create(
        {
            videoFile: videoFile?.url,
            thumbnail: thumbnail?.url,
            title,
            description,
            views,
            duration: req.files.videoFile[0]?.duration,
            owner: req.user?._id
        }
    )

    if (!video) {
        throw new ApiError(404,"Unable to publish a video")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, video, "Video uploaded successfully"))

    
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if (!videoId) {
        throw new ApiError(404, "Video doesn't exists")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "User doesn't exists")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"))
    
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title, description} = req.body
    //TODO: update video details like title, description, thumbnail

    if (!videoId) {
        throw new ApiError(404, "Video doesn't exists")
        
    }

    if (!title || !description) {
        throw new ApiError(404, "Title and Decription doesn't exists")
        
    }

    const getThumbnailPath = req.files.thumbnail[0]?.path

    if (!getThumbnailPath) {
        throw new ApiError(404, "Thumbnail doesn't exists")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video doesn't exists")
        
    }

    const getUpdatedVideo = await Video.findByIdAndUpdate(
        {
            title,
            description,
            thumbnail: thumbnail?.url
        }
    )

    await video.save()

    return res
    .status(200)
    .json(new ApiResponse(200, getUpdatedVideo, "Video updated successfully"))


})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if (!videoId) {
        throw new ApiError(404, "Video doesn't exists")
    }

    const video =  await Video.findByIdAndDelete(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //we have object in model jiski value change kar rahe hai
    
    
    const video = await Video.findById(videoId)
    
    if (!videoId) {
        throw new ApiError(404, "Video doesn't exists")
    }
    
    //before clicking thei video, check the current status  : if publish then unpublish it and vise versa
    //toggles the video
    video.isPublished = !video.isPublished;

    await video.save();

    return res
    .status(200)
    .json(new ApiResponse(200, video, `Video ${video.isPublished} ? "Video published " : "Video unpublished`))
    
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
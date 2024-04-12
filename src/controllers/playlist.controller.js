import mongoose, {isValidObjectId} from "mongoose"
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {  //working fine
    const { name, description } = req.body;

    console.log("Name :", name);

    if (!name || !description) {
        throw new ApiError(404, "Name and Description is required");
    }
    //TODO: create playlist
    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id,
    }); //owner: req.user._id is remaining

    if (!playlist) {
        throw new ApiError(404, "Playlist is not available");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {   //working fine
    const { userId } = req.params;
    //TODO: get user playlists
    
    if (!isValidObjectId(userId)) {
        throw new ApiError(404, "userId is invalid")
        
    }

    const userPlaylists = await Playlist.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                }
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                totalVideos: 1,
                totalViews: 1,
                updatedAt: 1
            }
        }
    
    ])

    
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                userPlaylists,
                "User Playlist fetched successfully"
            )
        );
});

const getPlaylistById = asyncHandler(async (req, res) => {   //working fine
    const { playlistId } = req.params;
    //TODO: get playlist by id

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {   //working fine
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(401, "playlistId and videoId are invalid");

    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(401,"Playlist doesn't exists")
        
    }
    
    // if(playlist.owner.toString() !== req.user?._id.toString()) {
    //     throw new ApiError(401 , "You dont have permission to add video")
    // }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(401,"Video doesn't exists")
        
    }

    const videoPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: {
                videos: videoId
            }
        },
        { new: true }
    );

    if (!videoPlaylist) {
        throw new ApiError(500, "Video doesn't exist in playlist");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                200,
                videoPlaylist,
                "Video Added to playlist successfully"
            )
        );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {  //woking fine.
    const { playlistId, videoId } = req.params;
    // TODO: remove video from playlist

    if (!playlistId) {
        throw new ApiError(404, "Playlist doesnt exists");
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $pull: { videos: videoId } }, // Use $pull to remove videoId from videos array
        { new: true }
    );

    if (!playlist) {
        throw new ApiError(404, "Video didn't exist in playlist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Video removed successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {  //working fine.
    const { playlistId } = req.params;
    // TODO: delete playlist

    if (!playlistId) {
        throw new ApiError(404, "Playlist doesnt exists");
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

    if (!deletedPlaylist) {
        throw new ApiError(404, "Playlist not deleted");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {  //working fine.
    const { playlistId } = req.params;
    const { name, description } = req.body;
    //TODO: update playlist

    if (!playlistId) {
        throw new ApiError(404, "Playlist doesnt exists");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description,
            },
        },
        { new: true }
    );

    if (!updatedPlaylist) {
        throw new ApiError(404, "Playlist didnt updated");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Playlist updated successfully"
            )
        );
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
};

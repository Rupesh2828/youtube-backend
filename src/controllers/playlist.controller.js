import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    console.log("Name :", name);

    if (!name || !description) {
        throw new ApiError(404, "Name and Description is required");
    }
    //TODO: create playlist
    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id,
    }); //owner: req.user._id is remaining

    if (!playlist) {
        throw new ApiError(404, "Playlist is not available");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    //TODO: get user playlists

    const userPlaylists = await Playlist.findById(userId);

    if (!userPlaylists || userPlaylists.length === 0) {
        throw new ApiError(404, "User Playlist doesnt exists");
    }

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

const getPlaylistById = asyncHandler(async (req, res) => {
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

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!playlistId) {
        throw new ApiError(404, "Playlist doesn't exist");
    }

    const videoPlaylist = await Playlist.findById(
        playlistId,
        {
            $addToSet: {
                video: videoId,
            },
        },
        { new: true }
    );

    if (!videoPlaylist) {
        throw new ApiError(404, "Video doesn't exist in playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videoPlaylist,
                "Video Added to playlist successfully"
            )
        );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
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

const deletePlaylist = asyncHandler(async (req, res) => {
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

const updatePlaylist = asyncHandler(async (req, res) => {
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

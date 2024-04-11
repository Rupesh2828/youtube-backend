import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    // TODO: toggle subscription

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(404, "ChannelId doesn't exists");
    }

    //checking for channel is exists or not
    const channel = await User.findById(channelId);

    if (!channel) {
        throw new ApiError(404, "Channel does not exists");
    }

    //checking for user is exists or not
    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(404, "User does not exists");
    }

    const existingSubscription = await Subscription.findOne({
        channelId,
        owner: req.user?._id,
    });

    if (existingSubscription) {
        // If already subscribed, unsubscribe
        await existingSubscription.remove();
        return res
            .status(200)
            .json(
                new ApiResponse(200, "Channel unsubscribed successfully", {
                    subscribed: false,
                })
            );
    } else {
        // If not subscribed, subscribe
        const newSubscription = new Subscription({
            channelId,
            owner: req.user?._id,
        });

        await newSubscription.save();

        return res
            .status(200)
            .json(
                new ApiResponse(200, "Channel Subscribed successfully", {
                    subscribed: true,
                })
            );
    }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };

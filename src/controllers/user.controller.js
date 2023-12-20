import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        //finds the user on the basis of userid from databse
        const user = await User.findById(userId); //for getting user id from database.

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        //saving refreshToken to database
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating refresh and access Token"
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    //step 1: get user details from users models
    const { fullName, email, password, username } = req.body;
    //  console.log(req.body);

    //step 2:validate the received fields like this in which its checking if the fields are empty or not
    if (
        [fullName, email, password, username].some(
            (field) => field?.trim === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    //step 3: Check if user is already exists : by using username or email

    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    //step 4: Check for images and avatar
    //this is locally path file not on cloudinary

    //  console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //   const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    let coverImageLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    //step 5: uploading avatar and coverimage on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    //step 6: create user object

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        username: username.toLowerCase(),
        email,
        password,
    });

    //step 7: removing password and refreshToken from server anf checked user creation
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering a user"
        );
    }

    //step 8: Returning response
    return res
        .status(201)
        .json(
            new ApiResponse(200, createdUser, "User registered successfully")
        );
});

const loginUser = asyncHandler(async (req, res) => {
    //get data from req body

    const { email, username, password } = req.body;

    if (!username && !email) {
        throw new ApiError(404, "Username and email is required");
    }

    //This is from validationg user on the basis  of username or email from database. Findone is the mongodb method. check various methods.
    const user = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!user) {
        throw new ApiError(404, "User does not exists");
    }

    //password check from usermodel where

    const isPasswordValid = await user.isPasswordCorrect(password); //this password is from req.body.

    if (!isPasswordValid) {
        throw new ApiError(404, "Password incorrect");
    }

    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
        user._id
    );

    const loggedInUser = await User.findOne(user._id).select(
        "-password -refreshToken"
    );

    //send tokens via cookies

    const options = {
        //by this cookies can only be modifyble in server not on front-end end
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    //this is for if user wants to save these fields on localstrage or he wants to develop mobile app for setuping the cookie so this is good practice.
                    user: loggedInUser,
                    refreshToken,
                    accessToken,
                },

                "User Logged In Successfully"
            )
        );

    //check username or email exists
    //find the user
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            },
        },
        {
            new: true,
        }
    );

    const options = {
        //by this cookies can only be modifyble in server not on front-end end
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Loggedout Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    //storing incoming refresh token

    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    //veifying refreshtoken using jwt and gets decoded token

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        //for getting user

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        //checking incoming token and users token

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: true,
        };

        const { newRefreshToken, accessToken } =
            await generateAccessAndRefreshToken(user._id);

        return res
            .status(200)
            .cookie("refreshToken", newRefreshToken, options)
            .cookie("accessToken", accessToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "AccessToken refreshed successfully"
                )
            );
    } catch (error) {
        throw new ApiError(404, error?.message || "Invalid Refresh Token");
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);

    //checking if old password is correct or not.
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old Password");
    }

    user.password = newPassword;
    await res.save({ validateBeforeSave: false });
    return res;
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(200, req.user, "Current user fetched successfully");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email,
            },
        },
        { new: true } //for getting updated value
    ).select("-password");

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Account Details Updated Successfully")
        );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalpath = req.file?.path;

    if (!avatarLocalpath) {
        throw new ApiError(400, "Avatar is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalpath);

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading an avatar");
    }

    // const user = await User.findByIdAndUpdate(
    //     req.user?._id,
    //     {
    //         $set: {
    //             avatar: avatar.url,
    //         },
    //     },

    //     { new: true }
    // ).select("-password");

    // return res
    //     .status(200)
    //     .json(new ApiResponse(400, user, "Avatar updated Successfully"));

    req.user.avatar = avatar.url;
    const updatedUser = await req.user.save();

    return res
        .status(200)
        .json(new ApiResponse(400, updatedUser, "Avatar updated Successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalpath = req.file?.path;

    if (!coverImageLocalpath) {
        throw new ApiError(400, "CoverImage is missing");
    }

    //deleting old coverimage-- ASSIGNMENT

    const user1 = await User.findById(req.user?._id).select("-coverImage");

    //checking if any existing image is there
    if (!user1.coverImage) {
        throw new ApiError(404, "CoverImage does not exists");
    }

    await deleteFromCloudinary(user1.coverImage);

    //uploading coverImage on cloudinary
    const newCoverImage = await uploadOnCloudinary(coverImageLocalpath);

    if (!newCoverImage.url) {
        throw new ApiError(400, "Error while uploading an coverImage");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: newCoverImage.url,
            },
        },

        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "CoverImage updated Successfully"));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    changeCurrentPassword,
    updateAccountDetails,
    updateUserCoverImage,
    updateUserAvatar,
};

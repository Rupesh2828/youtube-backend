import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

    if (!(username || email)) {
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
        .clerCookie("accessToken", options)
        .clerCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Loggedout Successfully"));
});

export { registerUser, loginUser, logoutUser };

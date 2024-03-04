import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials : true
} ))

//this is for express accepting json files in limited size.
app.use(express.json({limit:"20kb"}))

//this is for accepting the url which converts into encoded format in the limited size
app.use(express.urlencoded({extended:true, limit:"20kb"}))

//for storing any kind of files in public folder
app.use(express.static("public"))

app.use(cookieParser())

//routes import
import userRouter from "./routes/user.route.js"
import playlistRouter from "./routes/playlist.route.js"
import tweetRouter from "./routes/tweet.route.js"

//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/tweets", tweetRouter)


//https//localhost:3000/api/v1/users/register

export {app};
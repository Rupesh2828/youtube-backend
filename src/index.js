// require('dotenv').config({path : './env'})

import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({ path: "./env" });

const port = process.env.PORT || 4000;

connectDB()
    .then(() => {
        app.listen(port || 4000, () => {
            console.log(`Server is running at port : ${port}`);
        });
        app.on("Error", (error) => {
            console.log("Err: ", error);
            throw error;
        });
    })
    .catch((error) => {
        console.log("MONGOdb connection failed !!!", error);
    });

// following below code is alternate

// import express from "express"

// const app = express();

// ( async() => {
//     try {

//        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

//        app.listen(process.env.PORT , ()=> {
//         console.log(`This app is listening on ${process.env.PORT}`)
//        })

//     } catch (error) {
//         console.log("ERROR :"  , error);
//         throw error

//     }

// } )()

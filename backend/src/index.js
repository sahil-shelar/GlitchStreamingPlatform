import { configDotenv } from "dotenv";
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import express from "express";
import connectDB from "./db/db.js";
import { app } from "./app.js";

// const app = express();

configDotenv();

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running on ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log(err)
})


















/*
1. This is a way to connect to DB through index file, we use IIFE which gets executed as soon as the index is executed.
2. This is a way to connect to MongoDB using mongoose.
3. Using IIFE keeps the connection logic isolated and self-contained and Reduces the risk of polluting the global scope.
4. Ensures the connection logic runs immediately upon file execution. No need for external calls to initialize the connection.

( async () => {
    try{
        mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        // Below app.on is listener which is provided by express, which is basically used when DB is connected but the express app cannot listen to express. Its an event listener which means it listens error from DB
        app.on("error",()=>{
            console.log("Error connecting to database", error)
            throw error
        })

        app.listen(process.env.PORT,()=>{
            console.log(`App is listening of ${process.env.PORT}`)
        })
    }catch(error){
        console.error(error);
        throw error
    }
})()
*/
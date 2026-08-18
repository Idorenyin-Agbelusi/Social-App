import express from 'express';
import dotenv from 'dotenv';
import connectToMongoDb from "./db.js";

dotenv.config();
const app = express();
const {listen, use} = app;
connectToMongoDb();
const port = process.env.PORT;

listen(port, ()=>{
    console.log(`Server listening on port ${port}`);    
})
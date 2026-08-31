import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const {connect, connection} = mongoose;

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${encodeURIComponent(process.env.MONGO_PASSWORD)}@${process.env.MONGO_CLUSTER}/${process.env.MONGO_DB}`;

export default async function connectToMongoDb(){
    try{
        await connect(MONGODB_URI);
        console.log(`Connected to mongoDb successfully: ${connection.host} / DB: ${connection.name}`);
    }catch(err){
        console.log("Error connecting to MongoDb", err);
        process.exit(1);

    }
}
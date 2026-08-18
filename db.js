import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const {connect, connection} = mongoose;

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${encodeURIComponent(process.env.MONGO_PASSWORD)}@${process.env.MONGO_CLUSTER}/${process.env.MONGO_DB}`;

function connectToMongoDb(){
    connect(MONGODB_URI);

    connection.on('connected', () =>{
        console.log("Connected to mongoDb successfully");
    })

    connection.on('error', (err) => {
        console.log("Error connecting to MongoDb", err);        
    })
}

export default connectToMongoDb;
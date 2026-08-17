import mongoose from "mongoose";

const {Schema, model} = mongoose;

const postLikeSchema = new Schema({
    postId: {type: Schema.Types.ObjectId, ref: "Post", required: true},
    userId: {type: Schema.Types.ObjectId, ref: "User", required: true}
},
{timestamps: true});

postLikeSchema.index({postId: 1, userId:1}, {unique: true});
postLikeSchema.index({userId:1});

export default model("PostLike", postLikeSchema)
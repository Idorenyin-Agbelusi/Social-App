import mongoose from "mongoose";

const {Schema, model} = mongoose;

const PostCommentSchema = new Schema({
    postId: {type: Schema.Types.ObjectId, ref: "Post", required: true, index: true},
    author: {
        _id: {type: Schema.Types.ObjectId, ref: "User", required: true },
        username: { type: String, required: true }
    },
    content: {type: String, required:true},
    parentCommentId: {type: Schema.Types.ObjectId, ref: "PostComment", default: null, index: true},
    likeCount: {type: Number, default: 0}
},
{ timestamps: true});

PostCommentSchema.index({postId: 1, createdAt:-1});

export default model("PostComment", PostCommentSchema);
import mongoose from "mongoose";

const {Schema, model} = mongoose;

const postSchema = new Schema({
    title:{type: String, required: true},
    content: {type: String, required: true},
    tags: [{type: String, required: true}],
    author: {
        _id: {type: Schema.Types.ObjectId, ref: "User", required: true },
        username: { type: String, required: true }
    },
    state: { type: String, enum: ["draft", "published"], default: "draft" },
    like_count: { type: Number, default: 0, min: 0 },
    comment_count: { type: Number, default: 0, min: 0 },
},
{    
    timestamps: true,
}
);

postSchema.index({"author._id":1, createdAt: -1});
postSchema.index({ createdAt: -1});

export default model("Post", postSchema);

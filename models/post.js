import mongoose from "mongoose";

const {Schema, model} = mongoose;

const postSchema = new Schema({
    title:{type: String, required: true},
    content: {type: String, required: true},
    tags: {
        type: [{
            type: String, 
            required: true, 
            lowercase: true, 
            trim: true, 
            minlength: [3, 'Each tag must be at least 3 letters long']
        }],
        validate:{
            validator: function(tags) {
                return tags.every(tag => tag.length >= 3)
            },
            message: 'Each tag must be at least 3 letters long'
        }
    },
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
postSchema.index(
    {title: 'text', "author.username": 'text', tags: 'text'},
    {name: "SearchIndex"}
)

export default model("Post", postSchema);

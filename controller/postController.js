import post from "../models/post.js";
import postLike from "../models/postLike.js"
import postComment from "../models/postComment.js";
import mongoose from 'mongoose';

export const CreatePost = async(req, res, next) => {
    try{
        const currentUser = req.user;
        const { title, content, tags } = req.body;

        let processedTags = [];
        if (Array.isArray(tags)) {
            processedTags = tags.map(tag => tag.trim()).filter(Boolean);

            const invalidTag = processedTags.find(tag => tag.length < 3);
            if (invalidTag) {
                return res.status(400).json({
                status: 'fail',
                message: `Tag "${invalidTag}" is too short. Each tag must be at least 3 letters long.`
                });
            }
        }

        const createdPost = await post.create({
            title,
            content,
            tags: processedTags,
            author:{
                _id: currentUser._id,
                username: currentUser.username
            }
        });
        res.status(201).json({
            message: "successfully created",
            post: createdPost
        })
    } catch(error){
        next(error);
    }
}

export const GetAllPublishedPosts = async(req, res, next) => {
    try{    
        const{
            page = 1,
            pageLenght = 20,
            searchTerm,
            sortBy,
            order
        } = req.query;

        const pageN = parseInt(page);
        const pageLenghtN = parseInt(pageLenght);

        const filter = {
            state: 'published'
        }

        const sortOptions = {};

        if(searchTerm){
            const trimmedSearch = searchTerm.trim();
            
            filter.$text = {$search: trimmedSearch};
            sortOptions.score = {$meta: "textScore"};
        }
        
        const allowedSortFields = [
            "like_count",
            "comment_count",
            "createdAt"
        ];

        if(allowedSortFields.includes(sortBy)){
            sortOptions[sortBy] = order === "asc" ? 1 : -1
        }

        const totalPosts = await post.countDocuments(filter);

        const posts = await post.find(filter, searchTerm ? {score: { $meta: "textScore"}} :{})
            .sort(sortOptions)
            .skip((pageN - 1) * pageLenghtN)
            .limit(pageLenghtN);

        res.json({
            message: "Posts fetched successfully",
            currentPage: pageN,
            totalPages: Math.ceil(totalPosts / pageLenghtN),
            totalPosts,
            posts
        });
    } catch(error){
        next(error);
    }
}

export const GetASinglePost = async(req, res, next) => {
    try{
        const postById = await post.findById(req.params.id)
        if(!postById){
            return res.status(404).json({message:"Post not found"});
        }
        res.json({
            message: "Post fetched successfully",
            post: postById
        });
    }
    catch(error){
        next(error);
    }
}

export const GetAllPostsByUser = async(req, res, next) =>{
    try{
        const{
            page = 1,
            pageLenght = 20,
            searchTerm,
            sortBy,
            order,
            state
        } = req.query;
        const currentUser = req.user;

        const pageN = parseInt(page);
        const pageLenghtN = parseInt(pageLenght);

        const filter = {
            "author._id": currentUser._id
        }
        
        if(state)
        {
            filter.state = state;
        }

        const sortOptions = {};

        if(searchTerm){
            filter.$text = {$search: searchTerm};
            sortOptions.score = {$meta: "textScore"};
        }

        const allowedSortFields = [
            "like_count",
            "comment_count",
            "createdAt"
        ];

        if(allowedSortFields.includes(sortBy)){
            sortOptions[sortBy] = order === "asc" ? 1 : -1
        }

        const usersPost = await post
            .find(filter, searchTerm ? {score: { $meta: "textScore"}} :{})
            .sort(sortOptions)
            .skip((pageN - 1) * pageLenghtN)
            .limit(pageLenghtN);
        const totalPosts = await post.countDocuments(filter);

        res.json({
            message: " User's posts fetched successfully",
            currentPage: pageN,
            totalPages: Math.ceil(totalPosts / pageLenghtN),
            totalPosts,
            posts: usersPost
        });
    }
    catch(error){
        next(error);
    }
}

export const UpdateStatus = async(req, res, next) => {
    try{
        const currentUser = req.user;
        const {id, status} = req.params;

        const filter = {
            "_id" : id,
            "author._id": currentUser._id
        }

        const postToUpdate = await post.findOne(filter);

        if(!postToUpdate){
            return res.status(404).json({message:"Post not found"});
        }

        if(postToUpdate.state.toLowerCase() === status.toLowerCase()){
            return res.status(202).json({message: "successful", post: postToUpdate});
        }

        postToUpdate.state = status;

        await postToUpdate.save({validateBeforeSav: true});

        return res.status(202).json({message: "successful", post: postToUpdate});

    }
    catch(error){
        next(error);
    }
}

export const EditPost = async(req, res, next) => {
    try{
        const allowedUpdates = ["title", "content", "tags", "state"]
        const updates = {};

        Object.keys(req.body).forEach((key) => {
            if(allowedUpdates.includes(key)){
                updates[key] = req.body[key];
            }
        });

        const postToEdit = await post.findOne(
        {
            _id: req.params.id, 
            "author._id": req.user._id
        });

        if(!postToEdit){
            return res.status(404).json({message: "Post not found or authorized"})
        }

        Object.assign(postToEdit, updates);
        const editedPost = await postToEdit.save({validateBeforeSav: true});

        return res.json({
            message: "Post edited successfully",
            post: editedPost
        })
    }
    catch(error){
        next(error);
    }
}

export const DeletePost = async(req, res, next) => {
    try{
        const deletedPost = await post.findOneAndDelete(
            {
                _id: req.params.id, 
                "author._id": req.user._id
            }
        )

        if(!deletedPost){
            res.status(404).json({message: "Post not found or Unauthorized"});
        }

        res.json({message: "Post deleted successfully"});
    }
    catch(error){
        next(error);
    }
}

export const ToggleLikePost = async(req, res, next) => {
    try{
        const { id } = req.params;
        const userId = req.user._id;

        const postToLike = await post.findById(id);
        if(!postToLike){
            return res.status(404).json({ status: 'fail', message: 'Post not found' });
        }

        const existingLike = await postLike.findOne({ postId: id, userId });

        if (existingLike) {
            // --- UNLIKE ---
            await postLike.findByIdAndDelete(existingLike._id);

            // Decrement like_count (ensuring it doesn't drop below 0)
            const updatedPost = await post.findByIdAndUpdate(
                id,
                { $inc: { like_count: -1 } },
                { new: true }
            );

            return res.status(200).json({
                status: "success",
                liked: false,
                like_count: Math.max(0, updatedPost.like_count)
            });
        } else {
            // --- LIKE ---
            await postLike.create({ postId:id, userId });

            // Increment like_count
            const updatedPost = await post.findByIdAndUpdate(
                id,
                { $inc: { like_count: 1 } },
                { new: true }
            );

            return res.status(200).json({
                status: "success",
                liked: true,
                like_count: updatedPost.like_count
            });
        }
    }
    catch(error){
        next(error);
    }
}

export const AddPostComment = async(req, res, next) => {
    try{

    }
    catch(error){
        next(error);
    }
}
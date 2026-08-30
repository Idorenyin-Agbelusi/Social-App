import express from "express";
import passport from "passport";
import {
    GetAllPublishedPosts,
    GetASinglePost,
    CreatePost,
    GetAllPostsByUser,
    UpdateStatus,
    EditPost,
    DeletePost,
    ToggleLikePost
} from "../controller/postController.js";

const postRouter = express.Router();

postRouter.get("/", GetAllPublishedPosts);
postRouter.get("/by_user", passport.authenticate('jwt', {session: false}), GetAllPostsByUser);
postRouter.get("/:id", GetASinglePost);
postRouter.post("/", passport.authenticate('jwt', {session: false}), CreatePost);
postRouter.put("/:id/:status", passport.authenticate('jwt', {session: false}), UpdateStatus);
postRouter.put("/:id", passport.authenticate('jwt', {session: false}), EditPost);
postRouter.delete("/:id", passport.authenticate('jwt', {session: false}), DeletePost);
postRouter.post("/:id/toggle_like", passport.authenticate('jwt', {session: false}), ToggleLikePost);

export default postRouter;
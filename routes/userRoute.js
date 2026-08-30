import express from "express";
import {
  ToggleFollowUser,
  GetFollowingList ,
  GetFollowersList,
  GetUserList,
  GetNetworkCount
} from "../controller/userController.js";
import { protect } from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.get("/", protect, GetUserList);
userRouter.get("/network-counts", protect, GetNetworkCount);

// Follow / Unfollow target user
userRouter.post("/:targetUserId/follow", protect, ToggleFollowUser);

// Get users I follow / or target user follows
userRouter.get("/following", protect, GetFollowingList);
userRouter.get("/:userId/following", protect, GetFollowingList);

// Get users following me / or following target user
userRouter.get("/followers", protect, GetFollowersList);
userRouter.get("/:userId/followers", protect, GetFollowersList);

export default userRouter;
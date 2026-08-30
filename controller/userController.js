import Follow from "../models/follow.js";
import User from "../models/user.js";

// Toggle Follow / Unfollow
export const ToggleFollowUser = async (req, res) => {
  try {
    const followerId = req.user._id; // Logged-in user
    const { targetUserId } = req.params;

    // 1. Prevent users from following themselves
    if (followerId.toString() === targetUserId) {
      return res.status(400).json({
        status: "fail",
        message: "You cannot follow yourself"
      });
    }

    // 2. Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ status: "fail", message: "User not found" });
    }

    // 3. Check existing follow status
    const existingFollow = await Follow.findOne({
      followerId,
      followingId: targetUserId
    });

    if (existingFollow) {
      // --- UNFOLLOW ---
      await Follow.findByIdAndDelete(existingFollow._id);

      return res.status(200).json({
        status: "success",
        isFollowing: false,
        message: `Unfollowed @${targetUser.username}`
      });
    } else {
      // --- FOLLOW ---
      await Follow.create({
        followerId,
        followingId: targetUserId
      });

      return res.status(200).json({
        status: "success",
        isFollowing: true,
        message: `Now following @${targetUser.username}`
      });
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        status: "fail",
        message: "You are already following this user"
      });
    }
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// Get List of Users the Logged-in User Follows
export const GetFollowingList = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;

    const following = await Follow.find({ followerId: userId })
      .populate("followingId", "username first_name last_name email")
      .lean();

    const result = following.map((item) => item.followingId);

    return res.status(200).json({
      status: "success",
      count: result.length,
      users: result
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// Get List of Users Following the Logged-in User
export const GetFollowersList = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;

    const followers = await Follow.find({ followingId: userId })
      .populate("followerId", "username first_name last_name email")
      .lean();

    const result = followers.map((item) => item.followerId);

    return res.status(200).json({
      status: "success",
      count: result.length,
      users: result
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};
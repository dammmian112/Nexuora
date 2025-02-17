const express = require("express");
const router = express.Router();

const authController = require("./controllers/authController");
const postController = require("./controllers/postController");
const friendsController = require("./controllers/friendsController");
const storyController = require("./controllers/storyController");



router.post("/register", authController.upload.single("avatar"), authController.register);
router.post("/login", authController.login);
router.get("/user", authController.getUserProfile);
router.post("/updateBio", authController.updateBio);
router.post("/updateAvatar", authController.upload.single("avatar"), authController.updateAvatar);
router.delete("/deleteAccount", authController.deleteAccount);

router.post("/createPost", postController.createPost);
router.get("/posts", postController.getPosts);
router.post("/likePost", postController.likePost);
router.delete("/deletePost/:postId", postController.deletePost);

router.get("/friends/search", friendsController.searchFriends);
router.post("/friends/request", friendsController.sendFriendRequest);
router.get("/friends/requests", friendsController.getFriendRequests);
router.post("/friends/accept", friendsController.acceptFriendRequest);
router.post("/friends/reject", friendsController.rejectFriendRequest);
router.get("/friends/list", friendsController.getFriendsList);
router.post("/friends/remove", friendsController.removeFriend);
router.get("/friends/online", friendsController.getOnlineFriends);

router.post("/stories", storyController.upload.single("story"), storyController.createStory);
router.get("/stories", storyController.getStories);

console.log(" Trasy załadowane!");
console.log(router.stack.map(r => r.route?.path));

module.exports = router;
const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    content: { type: String, required: true },
    likes: { type: Number, default: 0 }
});

module.exports = mongoose.model("Post", PostSchema);

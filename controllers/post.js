const Post = require("../models/post");

exports.createPost = async (req, res) => {
    try {
        const { title, content, category, tags, status } = req.body;
        if (!title || !content || !category) {
            return res
                .status(400)
                .json({ message: "All fields must required" });
        }
        const post = new Post({
            title,
            content,
            category,
            tags,
            status,
            author: req.user._id,
        });
        await post.save();
        res.status(201).json({ message: "Post created successfully!", post });
    } catch (err) {
        res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
};

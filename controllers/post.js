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

exports.myPost = async (req, res) => {
    try {
        const userId = req.user._id;

        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 5;

        if (page <= 0) {
            page = 1;
        }
        if (limit <= 0) {
            limit = 5;
        }
        if (limit > 50) {
            limit = 10;
        }

        const skip = (page - 1) * limit;

        const myPost = await Post.find({ author: userId })
            .limit(limit)
            .skip(skip);

        const totalPosts = await Post.countDocuments({ author: userId });
        const totalPages = Math.ceil(totalPosts / limit);

        res.status(200).json({
            message: "My post: ",
            myPost,
            pages: totalPages,
            page: page,
            limit: limit,
            total: totalPosts
        });
    } catch (err) {
        res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
};

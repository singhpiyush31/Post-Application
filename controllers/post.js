const Post = require("../models/post");
const Comment = require("../models/comment");

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
            limit = 50;
        }

        const skip = (page - 1) * limit;

        const filter = { author: userId };

        if (req.query.search) {
            filter.title = { $regex: req.query.search, $options: "i" };
        }
        if (req.query.status) {
            filter.status = req.query.status;
        }
        if (req.query.category) {
            filter.category = req.query.category;
        }
        if (req.query.tags) {
            filter.tags = req.query.tags;
        }
        if (req.query.from || req.query.to) {
            filter.createdAt = {};
            if (req.query.from) {
                filter.createdAt.$gte = req.query.from;
            }
            if (req.query.to) {
                filter.createdAt.$lte = req.query.to;
            }
        }

        let sort = -1;
        if (req.query.sort == "oldest") {
            sort = 1;
        }

        const myPost = await Post.find(filter)
            .sort({ createdAt: sort })
            .limit(limit)
            .skip(skip);

        const totalPosts = await Post.countDocuments(filter);
        const totalPages = Math.ceil(totalPosts / limit);

        res.status(200).json({
            message: "My post: ",
            myPost,
            pages: totalPages,
            page: page,
            limit: limit,
            total: totalPosts,
        });
    } catch (err) {
        res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
};

exports.post = async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 5;

        if (page <= 0) {
            page = 1;
        }
        if (limit <= 0) {
            limit = 5;
        }
        if (limit > 50) {
            limit = 50;
        }

        const skip = (page - 1) * limit;

        const filter = { status: "Published" };

        if (req.query.search) {
            filter.title = { $regex: req.query.search, $options: "i" };
        }

        if (req.query.category) {
            filter.category = req.query.category;
        }
        if (req.query.tags) {
            filter.tags = req.query.tags;
        }
        if (req.query.from || req.query.to) {
            filter.createdAt = {};
            if (req.query.from) {
                filter.createdAt.$gte = req.query.from;
            }
            if (req.query.to) {
                filter.createdAt.$lte = req.query.to;
            }
        }

        let sort = -1;
        if (req.query.sort == "oldest") {
            sort = 1;
        }

        const post = await Post.find(filter)
            .populate("author", "name")
            .sort({ createdAt: sort })
            .limit(limit)
            .skip(skip);

        const totalPosts = await Post.countDocuments(filter);
        const totalPages = Math.ceil(totalPosts / limit);

        res.status(200).json({
            message: "Posts are: ",
            post,
            pages: totalPages,
            page: page,
            limit: limit,
            total: totalPosts,
        });
    } catch (err) {
        res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
};

exports.postById = async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await Post.findOne({
            _id: postId,
            status: "Published",
        }).populate("author", "name email");
        if (!post) {
            return res.status(404).json({ message: "Post not found! " });
        }
        res.status(200).json({ message: "Post: ", post });
    } catch (err) {
        res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
};

exports.deletePostById = async (req, res) => {
    try {
        const postId = req.params.id;
        const loggedInUser = req.user._id;

        const deletePost = await Post.findOneAndDelete({
            author: loggedInUser,
            _id: postId,
        });
        if (!deletePost) {
            return res.status(404).json({ message: "Post not found!" });
        }
        res.status(200).json({ message: "Post deleted successfully!" });
    } catch (err) {
        res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
};

exports.updatePostById = async (req, res) => {
    try {
        const postId = req.params.id;
        const loggedInUser = req.user._id;

        const { title, category, tags, content, status } = req.body;

        const updatePost = await Post.findOneAndUpdate(
            { _id: postId, author: loggedInUser },
            { title, category, tags, content, status },
            { returnDocument: "after", runValidators: true },
        );
        if (!updatePost) {
            return res.status(404).json({ message: "Post not found!" });
        }
        res.status(200).json({
            message: "Post updated successfully",
            updatePost,
        });
    } catch (err) {
        res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
};

exports.createComment = async (req, res) => {
    try {
        const postId = req.params.postId;
        const loggedInUser = req.user._id;
        const { comment } = req.body;

        if (!comment) {
            return res.status(400).json({ message: "Comment is required! " });
        }
        const post = await Post.findOne({ _id: postId, status: "Published" });
        if (!post) {
            return res.status(404).json({ message: "Post not found! " });
        }
        const newComment = new Comment({
            comment,
            post: postId,
            user: loggedInUser,
        });
        await newComment.save();
        res.status(201).json({
            message: "Comment Added Successfully!",
            comment: newComment,
        });
    } catch (err) {
        res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
};

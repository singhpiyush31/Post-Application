const Comment = require("../models/comment");

exports.deleteComment = async (req, res) => {
    try {
        const loggedInUser = req.user._id;
        const comment = req.params.commentId;
        const deleteComment = await Comment.findOneAndDelete({
            user: loggedInUser,
            _id: comment,
        });

        if (!deleteComment) {
            return res.status(404).json({ message: "Comment not found!" });
        }
        
        res.status(200).json({ message: "Comment deleted successfully!" });
    } catch (err) {
        res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
};

const express = require('express');
const { userAuth } = require('../middlewares/authentication');
const { deleteComment, updateComment } = require('../controllers/comment');

const commentRouter = express.Router();

commentRouter.delete("/:commentId", userAuth, deleteComment);
commentRouter.patch("/:commentId", userAuth, updateComment);

module.exports = commentRouter;
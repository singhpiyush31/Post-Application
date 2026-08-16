const express = require('express');
const { userAuth } = require('../middlewares/authentication');
const { deleteComment } = require('../controllers/comment');

const commentRouter = express.Router();

commentRouter.delete("/:commentId", userAuth, deleteComment);

module.exports = commentRouter;
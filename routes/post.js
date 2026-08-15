const express = require('express');

const { userAuth } = require('../middlewares/authentication');
const { createPost, myPost, post, postById, deletePostById } = require('../controllers/post');

const postRouter = express.Router();

postRouter.post("/", userAuth, createPost);
postRouter.get("/my", userAuth, myPost);
postRouter.get("/:id", postById);
postRouter.get("/", post);
postRouter.delete("/:id", userAuth, deletePostById);


module.exports = postRouter;
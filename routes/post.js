const express = require('express');

const { userAuth } = require('../middlewares/authentication');
const { createPost, myPost, post } = require('../controllers/post');

const postRouter = express.Router();

postRouter.post("/", userAuth, createPost);
postRouter.get("/my", userAuth, myPost);
postRouter.get("/", post);

module.exports = postRouter;
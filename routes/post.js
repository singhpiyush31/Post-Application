const express = require('express');

const { userAuth } = require('../middlewares/authentication');
const { createPost, myPost } = require('../controllers/post');

const postRouter = express.Router();

postRouter.post("/", userAuth, createPost);
postRouter.get("/my", userAuth, myPost);

module.exports = postRouter;
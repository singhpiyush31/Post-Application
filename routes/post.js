const express = require('express');

const { userAuth } = require('../middlewares/authentication');
const { createPost } = require('../controllers/post');

const postRouter = express.Router();

postRouter.post("/", userAuth, createPost);

module.exports = postRouter;
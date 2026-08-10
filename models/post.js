const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            minLength: 3,
            maxLength: 100,
        },
        content: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
            enum: [
                "Technology",
                "Travel",
                "Food",
                "Lifestyle",
                "Education",
                "Health",
                "Sports",
                "Other",
            ],
        },
        tags: {
            type: [String],
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            required: true,
            enum: ["Draft", "Published"],
            default: "Draft",
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model("Post", postSchema);

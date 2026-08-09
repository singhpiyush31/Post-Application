require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");

const { connectDB } = require("./config/database");
const authRouter = require("./routes/auth");

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRouter);

const PORT = process.env.PORT || 7777;

connectDB()
    .then(() => {
        console.log("Database connected successfully!");
        app.listen(PORT, () => {
            console.log(`Server is listening at port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Database not connected!", err.message);
        process.exit(1);
    });

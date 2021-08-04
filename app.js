/*
Customer satisfaction API
*/

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Global app object
const app = express();

// Middleware config
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

// Database connection
mongoose.connect(
    process.env.MONGO_URI,
    { useUnifiedTopology: true, useNewUrlParser: true }
);

const ReviewSchema = mongoose.Schema({
    store_id: {
        type: Number,
        required: true
    },
    rating: {
        type: Number,
        min: 0,
        max: 5
    },
    datetime: {
        type: Date,
        default: Date.now
    }
});

const Review = mongoose.model("review", ReviewSchema);

app.post("/review", function (req, res) {
    Review.create(req.body)
        .then(function (review) {
            res.status(201).send(review)
        })
        .catch(function (error) {
            res.status(400).send({ "type": error.name, "message": error.message })
        })
});

app.get("/", function (req, res) {
    res.send("Welcome tu customer satisfaction API!")
});

// Bootstrap server
const server = app.listen(process.env.PORT || 3000, function () {
    console.log(`Listening on port ${server.address().port}`);
});

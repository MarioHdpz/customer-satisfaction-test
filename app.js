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
    storeId: {
        type: Number,
        required: true
    },
    score: {
        type: Number,
        min: 0,
        max: 5,
        required: true
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

function getReportData(reviews) {
    const visitors = reviews.length;
    const reviewSum = reviews.reduce(function (sum, review) {
        return sum + review.score;
    }, 0);
    const average = reviewSum / visitors;
    return {
        averageScore: average ? average : 0,
        visitors
    }
}

function getFilters(req) {
    const filters = []
    if (req.query.from) {
        filters.push({ datetime: { $gte: req.query.from } })
    }
    if (req.query.to) {
        filters.push({ datetime: { $lte: req.query.to } })
    }
    if (filters.length) {
        return {$and: filters }
    }
    return {}
}

app.get("/report", function (req, res) {
    Review.find({ ...getFilters(req) }).then(function (reviews) {
        res.send(getReportData(reviews));
    }).catch(function (error) {
        res.status(400).send({ "type": error.name, "message": error.message })
    });
});

app.get("/report/:storeId", function (req, res) {
    Review.find({ ...getFilters(req), storeId: req.params.storeId }).then(function (reviews) {
        res.send(getReportData(reviews));
    }).catch(function (error) {
        res.status(400).send({ "type": error.name, "message": error.message })
    });
});

app.get("/", function (req, res) {
    res.send("Welcome tu customer satisfaction API!")
});

// Bootstrap server
const server = app.listen(process.env.PORT || 3000, function () {
    console.log(`Listening on port ${server.address().port}`);
});

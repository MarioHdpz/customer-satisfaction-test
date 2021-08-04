/*
Customer satisfaction API
*/

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


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

const UserSchema = mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: "director"
    },
    password: {
        type: String,
        required: true
    }
});

const User = mongoose.model("user", UserSchema);

function checkCredentials(req, res, next) {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(403).send({ "message": "A token is required for authentication" });
    }
    try {
        const user = jwt.verify(token, process.env.PRIVATE_KEY)
        req.user = user;
        next()
    } catch (error) {
        res.status(401).send({ "message": "Invalid API token" });
    }
}

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
        return { $and: filters }
    }
    return {}
}

app.post("/sign-up", function (req, res) {
    const password = bcrypt.hashSync(req.body.password, 10)
    User.create({ ...req.body, password: password }).then(function (user) {
        res.send(201);
    }).catch(function (error) {
        res.status(400).send({ "type": error.name, "message": error.message })
    });
});

app.post("/login", function (req, res) {
    const { email, password } = req.body;
    const errorMessage = { "message": "Incorrect user or password" };
    User.findOne({ email }).then(function (user) {
        if (!bcrypt.compareSync(password, user.password)) {
            res.status(401).send(errorMessage)
        }
        const token = jwt.sign({
            id: user._id,
            role: user.role
        }, process.env.PRIVATE_KEY )
        res.send({ token })
    }).catch(function (error) {
        res.status(400).send(error)
    });
});

app.post("/review", function (req, res) {
    Review.create(req.body)
        .then(function (review) {
            res.status(201).send(review)
        })
        .catch(function (error) {
            res.status(400).send({ "type": error.name, "message": error.message })
        })
});

app.get("/report", checkCredentials, function (req, res) {
    Review.find({ ...getFilters(req) }).then(function (reviews) {
        res.send(getReportData(reviews));
    }).catch(function (error) {
        res.status(400).send({ "type": error.name, "message": error.message })
    });
});

app.get("/report/:storeId", checkCredentials, function (req, res) {
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

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const db = require("./models/index.js");


const app = express();
app.use(morgan('combined'));    // Log generator
app.use(bodyParser.json());     // Allows the express app to easily parse any JSON requests that are sent in
app.use(cors());                // Allows any host or client to access this app

// Import the endpoints via the routes file
console.log("Port is: " + process.env.PORT);
require('./routes')(app, db.sequelize);

db.sequelize.sync()
    .then(() => {
        app.listen(process.env.PORT || 6178, () => {
            console.log(`Server listening to port ${process.env.PORT}...`)
        })
    });

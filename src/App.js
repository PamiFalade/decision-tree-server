const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');


const app = express();
app.use(morgan('combined'));    // Log generator
app.use(bodyParser.json());     // Allows the express app to easily parse any JSON requests that are sent in
app.use(cors());                // Allows any host or client to access this app

console.log("Hello World!!");
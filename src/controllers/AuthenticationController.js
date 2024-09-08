// Define the endpoints that deal with authentication, and expose them
const { User } = require("../models");


module.exports = {
    
    /// POST request: adding a new user to the Users table
    /// Request body should have an object with the following properties: FirstName, LastName, Email
    /// Will return an error if the email already exists in the table
    async addUser (request, response) {
        try {
            const newUser = User.build(request.body);
            await newUser.save();
            response.send(newUser.toJSON());
        }
        catch(err) {
            console.log(err);
            response.status(400).send({
                error: "This email is already in use."
            });
        }
    }
}
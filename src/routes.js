const AuthenticationController = require("./controllers/AuthenticationController.js");
const DecisionTreeController = require("./controllers/DecisionTreeController.js");

/*************** Create operations ***************/

// POST User endpoint
// Creates a new user in the database with the data passed in the request body
const addNewUser = (app) => {
    app.post('/api/users', AuthenticationController.addUser);
}

// POST DecisionTree endpoint
// Creates a new decision tree along with its nodes and adds them to the database.
const addDecisionTree = (app) => {
    app.post('/api/decision-trees', DecisionTreeController.addDecisionTree);
}



/*************** Read operations ***************/

// GET DecisionTree endpoint
// Retrieves a list of all decision trees
const getAllDecisionTrees = (app) => {
    app.get('/api/decision-trees', DecisionTreeController.getAllDecisionTrees);
}

// GET DecisionTree endpoint
// Returns the decision tree specified with the treeID
const getDecisionTreeAndNodes = (app) => {
    app.get('/api/decision-trees/:treeID', DecisionTreeController.getDecisionTreeAndNodes);
}



/*************** Update operations ***************/


// PUT DecisionTree endpoint
// Updates any changes to a decision tree's information,
// updates its nodes' information, adds new nodes and removes deleted nodes
const updateDecisionTreeAndNodes = (app) => {
    app.put('/api/decision-trees/:treeID', DecisionTreeController.updateDecisionTreeAndNodes);
}



/*************** Delete operations ***************/



module.exports = (app) => {
    addNewUser(app),
    addDecisionTree(app),
    getAllDecisionTrees(app),
    getDecisionTreeAndNodes(app),
    updateDecisionTreeAndNodes(app)
}
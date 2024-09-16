// Define the endpoints that deal with the decision trees
const { DecisionTree, Node } = require("../models");
const db = require("../models/index");

/// Helper function for saving the nodes of a decision tree in the database
async function saveChildNodes (nodes, parentID, treeID, t) {
    try{
        // Transform the nodes to fit the table's columns
        if(treeID == null){
            return;
        }
        const nodesToAdd = nodes.map((nodeData) => {
            return (
                {
                    node_name: nodeData.name,
                    node_type: nodeData.attributes.type,
                    expected_value: nodeData.attributes.expectedValue,
                    yield: nodeData.attributes.yield,
                    probability: nodeData.attributes.probability,
                    description: nodeData.attributes.description,
                    tree_id: treeID,
                    parent_node_id: parentID
                }
            )
        });

        // Add all child nodes to the Nodes table
        const createdNodes = await Node.bulkCreate(nodesToAdd, { transaction: t });

        // Save the children of any of these child nodes to the database 
        for(let i=0; i<nodes.length; i++) {
            if(nodes[i].children && nodes[i].children.length > 0) {
                await saveChildNodes(nodes[i].children, createdNodes[i].id, treeID, t);
            }
        }
    }
    catch(err) 
    {
        console.log(err);
    }
}


// Helper function that recursively retrieves all the nodes of a decision tree
async function getChildNodes (parentID, treeID) {

    console.log(`${parentID}, and ${treeID}`);
    const transformedNodes = [];    // The array of children of the current node
    try {
        // Get all children nodes of the current node
        await Node.findAll({
            where: {
                parent_node_id: parentID,
                tree_id: treeID
            }
        })
        .then(async (childNodes) => {       
            for (const nodeData of childNodes) {
                transformedNodes.push({
                    id: nodeData.id,
                    name: nodeData.node_name,
                    parentID: parentID,
                    attributes: {
                        type: nodeData.node_type,
                        yield: parseFloat(nodeData.yield),
                        expectedValue: nodeData.expected_value,
                        probability: parseFloat(nodeData.probability),
                        description: nodeData.description
                    },
                    children: await getChildNodes(nodeData.id, treeID)     // Recursively add children nodes
                })
            }
        });

        return transformedNodes; 

    }
    catch(err) {
        console.log(err);
        return err;
    }
}

// TODO: Make a general helper function for getting decision trees + nodes that can be used for both GET and UPDATE endpoints

// Helper function that upserts all the nodes of a decision tree.
// Upsert updates the node if it exists, and inserts the node if it doesn't.
// Could use upserts for both CREATE and UPDATE functions... decision for the future
async function updateChildNodes(childNodes, parentID, treeID, t) {
    try{

        // Check for any nodes that were deleted
        const childNodeIds = childNodes.map(node => node.id);       // The nodes that are in the updated tree
        const deletedNodes = [...(await Node.findAll({               // The nodes whose IDs exist in the Node table, and not in the updated DecisionTree
            attributes: ['NodeID'],
            where: {
                ParentNodeID: parentID,
                NodeID: {
                    [db.Op.notIn]: childNodeIds
                }
            }
        }, 
        { transaction: t }))].map(deletedNode => deletedNode.NodeID);

        await Node.destroy({                                    // Remove the deleted nodes from the Nodes table
            where: {
                NodeID: {
                    [db.Op.in]: deletedNodes
                }
            }
        }, 
        { transaction: t });

        // // Update existing nodes and insert new nodes
        for(let i=0; i<childNodes.length; i++) {
            // For each node, update it if it already exists, and insert it if it doesn't (uses the PK to check if it exists)
            const [upsertedNode, created] = await Node.upsert({
                id: childNodes[i].id,
                tree_id: treeID,
                node_name: childNodes[i].name,
                yield: childNodes[i].attributes.yield,
                expected_value: childNodes[i].attributes.expectedValue,
                node_type: childNodes[i].attributes.type,
                probability: childNodes[i].attributes.probability,
                description: childNodes[i].attributes.description,
                parent_node_id: parentID
            },
            { 
                transaction: t
            });

            // 'created' is a boolean that indicates whether the operation was an insert (true) or an update (false)
            if (created) {
                console.log('A new record was created.');
                console.log(upsertedNode);
            } else {
                console.log('An existing record was updated.');
            }

            if(childNodes[i].children) {
                await updateChildNodes(childNodes[i].children, childNodes[i].id, treeID, t);
            }
        }
    }
    catch(err) {
        console.log(err);
    }
}

module.exports = {
    
    /// POST request: adding a new decision tree to the database
    /// Request body should have the tree object. This function will first save the decision tree details.
    /// Then, it will traverse through the nodes of the tree and add them to the Nodes table.
    async addDecisionTree (request, response) {
        console.log(request.body);
        // Start the transaction
        const t = await db.sequelize.transaction();
        try {
                // First, save the new tree data into the DecisionTrees table
                const newDecisionTree = await DecisionTree.create({
                    tree_name: request.body.title,
                    creator_email: request.body.createdBy,
                    description: request.body.description
                },
                { transaction: t}
                );

                // Then save the root node in the Node table
                const root = request.body.decisionTreeNodes;
                const rootNode = await Node.create({
                    tree_id: newDecisionTree.id,
                    node_name: root.name,
                    yield: root.attributes.yield,
                    expected_value: root.attributes.expectedValue,
                    node_type: root.attributes.type,
                    probability: root.attributes.probability,
                    description: root.attributes.description,
                    parent_node_id: null
                },
                { transaction: t}
                );

                // Finally, save the rest of the nodes
                await saveChildNodes(root.children, rootNode.id, newDecisionTree.id, t);

                // Commit the transaction
                await t.commit();

                // Send the response
                response.status(201).send(newDecisionTree.toJSON());
        }
        catch(err) {
            await t.rollback();
            if(err.name == "SequelizeDatabaseError" ){
                response.status(500).send(err);
            }
            response.status(400).send(err);
        }
    },


    /// GET request: retrieving a single decision tree and its nodes from the database.
    /// Request header should have the ID of the desired decision tree.
    /// Request body should be empty. 
    /// Should return the decision tree that matches the ID passed into it, as well as all its nodes.
    async getDecisionTreeAndNodes (request, response) {
        const treeID = request.params.treeID;
        try {
            
            // First, get decision tree data
            const decisionTree = await DecisionTree.findByPk(treeID);
            if (!decisionTree) {
                return response.status(404).send({ error: 'Decision tree not found.' });
            }

            // Next, get the root node data and structure the object the way it is used in the front end
            const rootNode = await Node.findOne({
                where: {
                    node_type: 'Root',
                    tree_id: treeID
                }
            })
            .then((rootData) => {
                return (
                    { 
                        id: rootData.id,
                        name: rootData.node_name,
                        parentID: null,
                        attributes: {
                            type: rootData.node_type,
                            yield: parseFloat(rootData.yield),
                            expectedValue: rootData.expected_value,
                            probability: parseFloat(rootData.probability),
                            description: rootData.description
                        },
                    }
                )
            });
            
            rootNode.children = await getChildNodes(rootNode.id, treeID);        // From the root node, we can recursively get the other node data

            // Add the nodes to the decision tree
            const fullTree = {
                title: decisionTree.tree_name,
                createdBy: decisionTree.creator_email,
                description: decisionTree.description,
                decisionTreeNodes: rootNode
            }

            // const decisionTree = await DecisionTree.findByPk(treeID, { include: Node });
            // response.send(JSON.stringify(decisionTree, null));
            response.status(200).send(fullTree);
        }
        catch(err) {
            response.send({
                error: err
            });
        }
    },


    /// GET request: retrieve all decision trees in the database.
    /// Should return only the information for all the decision trees in the database.
    async getAllDecisionTrees (request, response) {
        try {
            const decisionTrees = await DecisionTree.findAll();
            if(!decisionTrees) {
                response.status(404).send({ error: 'No decision trees were found.' })
            }

            response.status(200).send(JSON.stringify(decisionTrees, null, 2));     // Appears that you have to use JSON.stringify instead of toJSON for lists
        }
        catch(err) {
            response.status(500).send({
                message: "Internal Server Error.",
                error: err
            });
        }
    },


    /// PUT request: update the decision tree and all its nodes.
    /// Request header should have the ID of the tree to be updated.
    /// Request body should have the updated tree object.
    async updateDecisionTreeAndNodes (request, response) {
        const treeID = request.params.treeID;
        const updatedTreeRequest = request.body;
        const root = request.body.decisionTreeNodes;
        
        // Start transaction
        const t = await db.sequelize.transaction();
        try {
            // Start by updating the nodes in the Nodes table. 
            // First the root node...
            await Node.update({
                node_name: root.name,
                expected_value: root.attributes.expectedValue,
                description: root.attributes.description,
            },
            {
                where: {
                    NodeID: root.id,
                    TreeID: treeID
                }
            },
            { transaction: t }); 

            // ...then the rest of the nodes
            await updateChildNodes(root.children, root.id, treeID, t);

            // Then update the decision tree in the DecisionTrees table
            await DecisionTree.update({
                TreeName: updatedTreeRequest.name,
                Description: updatedTreeRequest.description
            },
            {
                where: {
                    TreeID: treeID
                }
            },
            { transaction: t });

            // Find the tree in the database
            const updatedDecisionTree = await DecisionTree.findByPk(treeID, { transaction: t });
            if (!updatedDecisionTree) {
                return response.status(404).send({ error: 'Decision tree not found.' });
            }

            await t.commit();

            response.status(201).send(updatedDecisionTree);
        }
        catch(err) {
            t.rollback();
            response.send({error: err});
        }
    }


}
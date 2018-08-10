
var AWSXRay = require("aws-xray-sdk-core");
var logger = require('winston');
AWSXRay.setLogger(logger);
var AWS = AWSXRay.captureAWS(require('aws-sdk'));

var docClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

exports.handler = (event, context, callback) => {
    var table = "xrayk8s";


    console.log('Received event:', JSON.stringify(event, null, 2));

    var response = {};

    var id = Math.floor(new Date() / 1000);
    var username = event.username;
    var message = event.message;


    var params = {
    TableName:table,
        Item:{
            "id":id,
            "message": message,
            "username": username
        }
    };

console.log("Adding a new message to DynamoDB: "+message);
response.message = "Adding a new message to DynamoDB: "+message;

AWSXRay.captureAsyncFunc("## dynamodb", function(subsegment) {
    docClient.put(params, function(err, data) {
        if (err) {
            console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
            response.message = "Unable to add item. Error JSON:", JSON.stringify(err, null, 2);
        } else {
            console.log("Added item:", JSON.stringify(data, null, 2));
            response.message = "Added item:", JSON.stringify(data, null, 2);
        }

        subsegment.close();
    });
    subsegment.addAnnotation("username",username);
    subsegment.addAnnotation("message",message);
});

    callback(null, response);
};

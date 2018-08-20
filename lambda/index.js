var AWSXRay = require("aws-xray-sdk-core");
var logger = require('winston');
AWSXRay.setLogger(logger);
var AWS = AWSXRay.captureAWS(require('aws-sdk'));

var docClient = new AWS.DynamoDB.DocumentClient({
  apiVersion: '2012-08-10'
});

// Table name is configured as env var.
var table = process.env.TABLE_NAME;

exports.handler = (event, context, callback) => {

  console.log('Received event:', JSON.stringify(event, null, 2));

  var responseBody = {
      message: ""
  };

  var response = {
      statusCode: 200,
      body: ""
  };

  var responseCode = 200;

  var username = "";
  var message = "";

  if (event.queryStringParameters !== null && event.queryStringParameters !== undefined)
  {
    if (event.queryStringParameters.username !== undefined &&
      event.queryStringParameters.username !== null &&
      event.queryStringParameters.username !== "") {
      console.log("Received username: " + event.queryStringParameters.username);
      username = event.queryStringParameters.username;
    }

    if (event.queryStringParameters.message !== undefined &&
      event.queryStringParameters.message !== null &&
      event.queryStringParameters.message !== "") {
      console.log("Received message: " + event.queryStringParameters.message);
      message = event.queryStringParameters.message;
    }
  }

  if (username !== "" && message !== "")
  {
    var id = Math.floor(new Date() / 1000);

    var params = {
      TableName: table,
      Item: {
        "id": id,
        "message": message,
        "username": username
      }
    };

    console.log("Adding a new message to DynamoDB: " + message);

    AWSXRay.captureAsyncFunc("## Writing to DynamoDB", function(subsegment) {
      docClient.put(params, function(err, data) {
        if (err) {
          console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
          responseBody.message = "Unable to add item. Error JSON:", JSON.stringify(err, null, 2);
          response.statusCode = 503;
        } else {
          console.log("Added item:", JSON.stringify(data, null, 2));
          responseBody.message = "Added item:", JSON.stringify(data, null, 2);
        }

        response.body = JSON.stringify(responseBody);
        console.log("response: " + JSON.stringify(response))

        callback(null, response);

        subsegment.close();
      });
      subsegment.addAnnotation("username", username);
      subsegment.addAnnotation("message", message);
    });
  } else {
    responseBody.message = "No item added!"
    response.statusCode = 503;
    response.body = JSON.stringify(responseBody);

    console.log("response: " + JSON.stringify(response))

    callback(null, response);
  }

};


var AWSXRay = require("aws-xray-sdk-core");
var AWS = AWSXRay.captureAWS(require('aws-sdk'));

var docClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

var MongoClient = require('mongodb').MongoClient;
var mongodbURI = "mongodb://172.31.54.122:27017";

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

AWSXRay.captureAsyncFunc("## Writing to DynamoDB", function(subsegment) {
    docClient.put(params, function(err, data) {
        if (err) {
            console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
            response.message = "Unable to add item. Error JSON:", JSON.stringify(err, null, 2);
            subsegment.close(err);
        } else {
            console.log("Added item:", JSON.stringify(data, null, 2));
            response.message = "Added item:", JSON.stringify(data, null, 2);
            subsegment.close();
        }
    });
    subsegment.addAnnotation("username",username);
    subsegment.addAnnotation("message",message);
});

AWSXRay.captureAsyncFunc("## Writing to MongoDB", function(subsegmentmongo){
    var jsonContents = "{\"username\":\""+username+"\",\"message\":\""+message+"\"}";
    MongoClient.connect(mongodbURI,{ useNewUrlParser: true }, function (err, client) {
                if(err){
                    console.log("Error while connecting to MongoDB: "+err, err.stack);
                    subsegmentmongo.close(err);
                }
                else{
                    console.log("Successfully connected to MongoDB");
                    cachedDb = client.db('xrayk8s');
                    subsegmentmongo.addAnnotation("jsonmongo",jsonContents);
                    createDoc(cachedDb, jsonContents,callback);
                    subsegmentmongo.close();
                }

                client.close();
    });
});

};

function createDoc (db, json,callback) {
  var response = {};
  var jsonObj = JSON.parse(json);
  db.collection('messages').insertOne( jsonObj, function(err, result) {
      if(err!=null) {
          console.error("an error occurred in createDoc", err);
          callback(err);
      }
      else {
        console.log("Great! You have just entered a new message to MongoDB with id: " + result.insertedId);
        response.message = "Successfully added to MongoDB: "+result.insertedId;
        callback(null,response);
      }
      //db.close();
  });
};

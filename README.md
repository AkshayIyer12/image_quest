# image_quest
The project can be run using ```npm start```.
This will start the server.

There are 5 API's:
1. Create AccessKey using : /createAccessKey
2. GET Image associated with AccessKey and ImageID: /image/:accessKey/:imageId
3. GET List of all images associated with the AccessKey: /image/:accessKey
4. POST Image associated with AccessKey: /image/:accessKey
5. PATCH Update Image associated with AccessKey and same filename: /image/:accessKey {Body: {filename: "original file name"}}
6. DELETE Image associated with Accesskey and filename: /image/:accessKey {Body: {filename: "original file name"}}

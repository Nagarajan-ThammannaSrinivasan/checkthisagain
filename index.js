const { timeStamp, Console } = require('console')
const express = require('express')
const http = require('http')
const { stringify } = require('querystring')
const WebSocket = require('ws')

const port = process.env.PORT || 5000
console.log(port)
const app = express()
const httpServer = http.createServer(app)
const wss = new WebSocket.Server({
    'server': httpServer
})
httpServer.listen(port)

app.use(express.urlencoded({
    extended: true  
}));

app.use(express.json())

app.use(function(req, res, next) {
    if (req.headers.origin) {
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Authorization')
        res.header('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE')
        if (req.method === 'OPTIONS') return res.send(200)
    }
    next()
})

var connectedClients = [];

var standardPayload = {
    platform : "Browser",
    msgType  : "newClient",
    data : {}
}


 wss.on("connection", function(ws, req){
    // Create Id for each connected Client
    // ws.id = 'user_' + Math.random();
    // Push all clients into a list
    connectedClients.push(ws);
    
    ws.on('ping', function(data){
        console.log('onping');
        console.log(connectedClients.length)
    })

    ws.on('pong', function(data){
        console.log('onpong');
        // console.log(connectedClients.length);
    })
    // connectedClients.forEach(x =>{
    //     console.log(x.id )
    // })

    // When Server gets a message from clients
    ws.on('message', function(msg){ 
        msg = JSON.parse(msg); 
        ws.platform = msg.platform == "Browser" ? "Browser" : "Mobile";
        // console.log(ws.platform)
        console.log(msg)

        if(msg.msgType == 'NewClient'){
            // When client gets connected, Save thier ID
            ws.id = msg.data.ID
            standardPayload ={
                platform : ws.platform,
                msgType : "NewClient",
                data:{
                    ID : msg.data.ID
                }
            }
            ws.send(JSON.stringify(standardPayload));
        }
        else if(msg.msgType == 'Message'){
            wss.clients.forEach(client =>{
                standardPayload ={
                    platform : ws.platform,
                    msgType : "Message",
                    data:{
                        ID : ws.id,
                        Notification : msg.data.Notification
                    }
                }
                if(msg.platform == "Mobile" && client.platform == "Browser"){
                    // If message comes from Mobile send that to Browser
                    client.send(JSON.stringify(standardPayload));
                }
                else if(msg.platform == "Browser" && client.platform == "Mobile" && msg.data.To == "AllMobile"){
                    // If message comes from Browser send that to Mobile based on 'To' property of payload
                    client.send(JSON.stringify(standardPayload));
                }
                else if(msg.platform == "Browser" && client.platform == "Mobile" && msg.data.To == client.id){
                    // If message comes from Browser send that to Mobile based on 'To' property of payload
                    client.send(JSON.stringify(standardPayload));
                }
            })
        }
        else if(msg.msgType == 'Geolocation'){
            wss.clients.forEach(client =>{   
                console.log(client.id);
                console.log(client.contactNumber);
                if(client.id == msg.data.Client_ID){
                    //Assign data
                    client.geolocation = {
                        lat : msg.data.lat,
                        lng : msg.data.lng
                    }
                    client.contactNumber = msg.data.Driver_Contact_No
                    
                    console.log(client.contactNumber);
                    // console.log(client)
                    // console.log(client.id + 's Contact Number' +  client.contactNumber)
                } 
                if(client.OPEN == 1  ){
                    client.send(JSON.stringify(msg))
                }
                else{
                    console.log(client.id + " CLOSED")
                }
            })
        }
        

        // var cur_Time = new Date();
        // console.log(cur_Time.getHours() + ':'+ cur_Time.getMinutes() + ":" + cur_Time.getSeconds() + ":"  + msg );         
    })

    // When client gets closed, pop them from clients list
    ws.on('close', function(){
        console.log(this.id + " closed");
        var indexClientID = connectedClients.indexOf(this);
        connectedClients.splice(indexClientID, 1);
        // console.log("length " + connectedClients.length);
        // connectedClients.forEach(x =>{
        //     console.log(x.id )
        // })
        wss.clients.forEach(client =>{
            if(client.id != ws.id && client.platform != 'Mobile'){
                standardPayload ={
                    platform : ws.platform,
                    msgType : "Message",
                    data:{
                        ID : ws.id,
                        Notification : ws.id + " went off the grid. Call him at " + ws.contactNumber 
                    }
                }
                client.send(JSON.stringify(standardPayload))
            }
        })
    })
   
   // When client gets errored
    ws.on('error', function(){
       console.log(this.id + " errored");
       var indexClientID = connectedClients.indexOf(this);
       // console.log(indexClientID);
       connectedClients.splice(indexClientID, 1);
   })

   setInterval(() => {
       ws.ping('Ping')
   }, 10000);
 })



 app.get('/',  (req, res) =>{
    console.log("hit")
    res.send("Hello Buddy !!")
 })

 app.post('/postLocation',  (req, res) =>{
    // console.log(req.body)
    // ws.send(JSON.stringify(req))
    // fs.readFile( __dirname + "/" + "truckLocation.json", 'utf8', function (err, data) {
    //    console.log( data );
    //    res.end( data );
    // });
    res.send(req.body)
    var incomingPayload = req.body.standardPayload;
    
    wss.clients.forEach(client =>{   
        if(client.id == incomingPayload.data.clientID){
            client.geolocation = {
                lat : incomingPayload.data.lat,
                lng : incomingPayload.data.lng
            }
            // console.log(client.geolocation)
        } 
        if(client.OPEN == 1  ){
            client.send(JSON.stringify(incomingPayload))
        }
        else{
            console.log(client.id + " CLOSED")
        }
    })
})

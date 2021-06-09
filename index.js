const { timeStamp } = require('console')
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
    ws.id = 'user_' + Math.random();
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
            // When client gets connected, send back their Id
            standardPayload ={
                platform : ws.platform,
                msgType : "NewClient",
                data:{
                    ID : ws.id
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
                client.send(JSON.stringify(standardPayload));
            })
            // standardPayload ={
            //     platform : ws.platform,
            //     msgType : "Message",
            //     data:{
            //         ID : ws.id,
            //         Notification : msg.data.Notification
            //     }
            // }
            // ws.send(JSON.stringify(standardPayload));
        }
        else if(msg.msgType == 'Geolocation'){
            wss.clients.forEach(client =>{   
                if(client.id == msg.data.clientID){
                    //Assign data
                    client.geolocation = {
                        lat : msg.data.lat,
                        lng : msg.data.lng
                    }
                    client.id.contactNumber = msg.data.Driver_Contact_No
                    // console.log(client.geolocation)
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
        // console.log(indexClientID);
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
                        Notification : ws.id + " : driver went off the grid. Do you want to call him ?. Call him at " + ws.Driver_Contact_No 
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
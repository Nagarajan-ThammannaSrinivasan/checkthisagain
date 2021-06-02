// var server = require('ws').Server;
// var PORT =  5000;
// var s = new server({port: PORT});
// // process.env.PORT ||
// var express = require('express')
// var app = express();
// app.use(express.urlencoded({
//     extended: true
//   }));

// app.use(express.json())

// var nodeHttpserver = app.listen(PORT, () =>{
//     var host = nodeHttpserver.address().address
//     var port = nodeHttpserver.address().port
//     console.log("Example app listening at http://%s:%s", host, port)
//     console.log('up and running')
// })


// s.on('connection', function(ws){
//     ws.emit('An event emiited')
//     ws.on('message', function(msg){
//         console.log('msg received is ' + msg );
     
//     })

   
//     var gpsData = {
//         id: '1',
//         lat: 80.0,
//         long: 23.4 
//     }
//     ws.send(JSON.stringify(gpsData))

//     // sendDataFromWS(ws)

//     setTimeout( function(){
//         ws.send('Greetings from Server')
//     }    , 10000)
// })

// // var oracleDB = require('oracledb')



// app.post('/postLocation',  (req, res) =>{
//     console.log(req.body)
//     // ws.send(JSON.stringify(req))
//     // fs.readFile( __dirname + "/" + "truckLocation.json", 'utf8', function (err, data) {
//     //    console.log( data );
//     //    res.end( data );
//     // });
//     res.end(JSON.stringify(req.body))
//     s.clients.forEach(client =>{        
//         client.send(JSON.stringify(req.body))
//     })
//  })

 /////
 const express = require('express')
 const http = require('http')
 const WebSocket = require('ws')
 
 const port = process.env.PORT || 5000
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

 wss.on("connection", function(ws){
    console.log('connected')
    ws.on('message', function(msg){
         ws.send('__Pong__')
        console.log('msg received is ' + msg );         
    })
    setTimeout( function(){
        ws.send('Greetings from Server')
    }, 10000)
 })

 wss.on('close', function(ws){
     console.log(" wss close");
     console.log(ws)
 })

 wss.on('error', function(ws){
    console.log(" wss error");
    console.log(ws)
})

 app.get('/',  (req, res) =>{
     res.send("Hello Buddy !!")
 })

 app.post('/postLocation',  (req, res) =>{
    console.log(req.body)
    // ws.send(JSON.stringify(req))
    // fs.readFile( __dirname + "/" + "truckLocation.json", 'utf8', function (err, data) {
    //    console.log( data );
    //    res.end( data );
    // });
    res.send(req.body)
//     res.end(JSON.stringify(req.body))
    console.log(wss.clients[0])
   wss.clients.forEach(client =>{      
        if(client.OPEN == 1  ){
            client.send(JSON.stringify(req.body))
        }
        else{
            console.log("CLOSED")
        }
    })
})

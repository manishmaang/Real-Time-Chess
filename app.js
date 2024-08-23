const http = require('http');
const express = require("express");
const socket = require('socket.io');
const {Chess} = require('chess.js');
const path = require('path');



const app = express();
const chess = new Chess();

//app object pass krne ka ye mtlb hai ki sari incoming request server pr app object ke through handle hongi
//meaning express ke through handle hongi
const server = http.createServer(app); 
const io =  socket(server);

let players = {};
let currentPlayer = "w"; //pehla player white set ho jayega

app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")));



app.get('/',function(req,res){
    res.render('index');
})

io.on("connection",function(uniqueSocket){
    console.log("new user connected");
    
    //pehle to check kr rhe hai players me koi white feild hai ki nhi agr hai to fir black check kro 
    //agr black feild bhi bn chuki hai to fir baki bande ko spectator role assign krdo.
    if(!players.white){
     players.white = uniqueSocket.id;
     // jo banda connect hua hai sirf usi bande ko wps info bej rhe hai ki vo white hai
     uniqueSocket.emit("playerRole","w")
    }
    else if(!players.black){
        players.black = uniqueSocket.id;
    // jo banda baad me connect hua hai sirf usi ko info bej rhe hai ki vo blach hai
        uniqueSocket.emit("playerRole","b");
    }
    else{
        uniqueSocket.emit("spectatorRole");
    }

    uniqueSocket.on("disconnect",function(){
       console.log("user is disconnected");
       if(players.white === uniqueSocket.id){
        delete players.white;
       }
       else if(players.black === uniqueSocket.id){
        delete players.black;
       } 
    })

    uniqueSocket.on("move",function(move){
        try{
//agr white ki turn hai or black move kr rha hai to hum whi se return ho jayenge kyuki vo peices idhr udhr
//hila skta hai jb uski turn nhi hai usme hume error nhi dena hai 
//in between usne(jiski move nhi hai) agr peice khi or rkha to vo peice uski source square me wps aa jayega            
          if(chess.turn() === 'w' && uniqueSocket.id !== players.white) return;
          if(chess.turn() === 'b' && uniqueSocket.id !== players.black) return;

//ye validate kr rhe hai ki jiski turn hai vo valid move chl rha hai ya nhi agr valid move hai to 
//result me truth aayega nhi to err aayega or sirf isi ke karan try and catch lgaya tha humne 
          const result = chess.move(move);

          if(result)
          {
            currentPlayer = chess.turn();
            io.emit("move",move); //agr valid move hai to sbhi sockets ko update krdo
            io.emit("boardState", chess.fen()); //chess.fen() board ki current state =>kona peice kha hai
    //ye batata hai to move validate hogyi to front-end pr update krne ke liye fen equation bej rhe hai 

          }
          else{
            console.log("Invalid move : ",move);
            uniqueSocket.emit("invalidMove",move);//jo bnde ne glt move chli hai sirf usi ko bta rhe hai ki wrong move hai 
          }
        }
        catch(err){
            //agr kisi move ke karan engine fail ho jata hai to us err ko hum catch karenge 
            // const result = chess.move(move);
            console.log(err);
            uniqueSocket.emit("Invalid move : ",move);
        }
    })
});

server.listen(3000,function(){
    console.log("server is running");
});
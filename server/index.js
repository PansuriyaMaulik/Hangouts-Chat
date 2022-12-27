const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const router = require('./router');
const cors = require('cors');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');

const PORT = process.env.PORT || 5000

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(router);
app.use(cors());

io.on('connect', (socket) => {
    socket.on('join', ({name, room}, callback) => {
        const { error, user } = addUser({ id: socket.id, name, room });  
        console.log(user);
        if (error) return callback(error); 

        socket.join(user.room);
        
        //Admin generated Message ---- emit event from frontend to backend 
        socket.emit('message', {user: 'admin', text: `${user.name}, welcome to the room ${user.room}`});
        socket.broadcast.to(user.room).emit('message', {user: 'admin', text: `${user.name}, has joined ${user.room}!!`})

        callback();
    });

    //User generated message --- expect the event on backend then frontend emit those event
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        
        //Here, text message comes from frontend
        io.to(user.room).emit('message', { user: user.name, text: message });
        callback();
    });

    socket.on('disconnect', () => {
        console.log("User had left!!!");
    });
});

server.listen(PORT, () => {
    console.log(`Server has started on ${PORT}`)
});
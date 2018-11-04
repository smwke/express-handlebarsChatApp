module.exports = (io)=>{
    io.on('connection',(socket)=>{
        socket.on("subscribe",data=>{
            socket.join(data.room);
        });
        socket.on("messageSent",data=>{
            socket.broadcast.emit()
        });
    });
}
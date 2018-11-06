const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const mongoose = require('mongoose');

require('./models/ChatRoom');
const ChatRoom = mongoose.model('chatrooms');

//Server + socket.io
const app = express();

// Load routes
const users = require('./routes/users');
const chatrooms = require('./routes/chatrooms');

// Passport Config
require('./config/passport')(passport);

// Map global promise - get rid of warning
//mongoose.Promise = global.Promise;

// Connect to mongoose


mongoose.connect("mongodb://dorin:dorin_28469@ds253783.mlab.com:53783/chatapp", {
    useNewUrlParser: true
  },(err)=>{
      if(err)throw err;
      console.log("MongoDB connected...");
  });
// Handlebars Middleware
app.engine('handlebars', exphbs({
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

// Method override middleware
app.use(methodOverride('_method'));

// Express session midleware
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

// Global variables
app.use(function (req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    next();
});

const http = require('http').Server(app);
const io = require('socket.io')(http);

//Load socket.io events
//require('./server-socket')(io);

io.on("connection",(socket)=>{


    socket.on("subscribe",data=>{
        socket.join(data.room);
        socket.room = data.room;
        socket.name = data.name;
        ChatRoom.find({name:socket.room},(err,result)=>{
            if(err)throw err;
            socket.emit("messageList",result[0].messages);
        });
    });
    socket.on("messageSent",data=>{
        console.log("sent a message!");

        ChatRoom.find({},(err,result)=>{
            console.log(result);

            if(err)throw err;
            
            let index = result.findIndex(x=>x.name == socket.room);
            console.log(socket.room);
            console.log(index);
            if(index < 0){
                return;
            }
            console.log("someone wrote a message on "+result[index].name)
            result[index].messages.push({sender:socket.name,text:data.message});
            result[index].save();

        });
        socket.broadcast.in(socket.room).emit("messageReceive",{sender:socket.name,message:data.message});
        //io.sockets.in(socket.room).emit("messageReceive",{sender:socket.name,message:data.message});
    });
});

// Index Route
app.get('/', (req, res) => {
    res.render('index');
});

// Use routes
app.use("/users",users);
app.use("/chatrooms",chatrooms);

http.listen(process.env.port,()=>{
    console.log("Sever started");
});
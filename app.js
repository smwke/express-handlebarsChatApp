const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const mongoose = require('mongoose');

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
mongoose.connect('mongodb://localhost/chatApp', {
    useNewUrlParser: true
},(err)=>{
    if(err)throw err;
    else console.log("MongoDB connected...")
})

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
    });
    socket.on("messageSent",data=>{
        console.log(data.message);
        console.log(socket.room);
        io.sockets.in(socket.room).emit("messageReceive",{sender:socket.name,message:data.message});
    });
});

// Index Route
app.get('/', (req, res) => {
    res.render('index');
});

// Use routes
app.use("/users",users);
app.use("/chatrooms",chatrooms);

const port = 4200;

http.listen(port,()=>{
    console.log("Sever started on port "+port);
});
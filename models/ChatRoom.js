const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const ChatRoomSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    messages:[
        {
            sender:{
                type: String,
                required: true
            },
            text:{
                type:String,
                required:true
            }
        }
    ],
    users:[
        {
            name:{
                type: String,
                required: true
            }
        }
    ],
    date: {
        type: Date,
        default: Date.now
    }
});

mongoose.model('chatrooms', ChatRoomSchema);
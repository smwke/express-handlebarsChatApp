const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { ensureAuthenticated } = require("../helpers/auth");

// Load ChatRoom Model
require('../models/ChatRoom');

const ChatRoom = mongoose.model('chatrooms');

// ChatRoom Index Page
router.get('/', ensureAuthenticated, (req, res) => {
    ChatRoom.find({})
        .sort({ date: 'desc' })
        .then(chatrooms => {
            res.render('chatrooms/index', {
                chatrooms: chatrooms
            });
        });
});

// Add ChatRoom Form
router.get('/add', ensureAuthenticated, (req, res) => {
    res.render('chatrooms/add');
});

router.delete('/:name',ensureAuthenticated, (req,res)=>{
    ChatRoom.deleteOne({name:req.params.name},(err,result)=>{
        if(err)throw err;
        req.flash('success_msg', 'chat room deleted');
        res.redirect('/chatrooms/');
    });
    
})

// Process Form
router.post('/', ensureAuthenticated, (req, res) => {
    let errors = [];

    if (!req.body.roomname) {
        errors.push({ text: 'Please provide a name' });
    }
    if (errors.length > 0) {
        res.render('chatrooms/add', {
            errors: errors,
            roomname: req.body.roomname
        });
    } else {
        const newRoom = {
            creator: res.locals.user.name,
            name: req.body.roomname
        }
        new ChatRoom(newRoom)
            .save()
            .then(room => {
                req.flash('success_msg', 'chat room added');
                res.redirect('/chatrooms');
            })
    }
});

//For when the client wishes to join a chat room
router.get('/:id', ensureAuthenticated, (req, res) => { 
    ChatRoom.find({}, (err, result) => { //Get all chatroom objects from MongoDB
        if (err) throw err;

        //Check wether the client is in ANY room -> [roomindex] <-.
        let roomindex = result.findIndex(x => x.users[x.users.findIndex(y => y.name == res.locals.user.name)] != null);

        //Find the index for the room that the client wants to connect to.
        let targetindex = result.findIndex(x => x._id == req.params.id);

        /* If the room that the client wishes to connect to -> [] <-
        is the same as the one he was previously in -> [roomindex] <- , do nothing. */

        if (roomindex == targetindex) {
            res.render('chatrooms/room',{room:result[targetindex]});
            return;
        }
        if (roomindex < 0) { //If he wasn't in any room before, simply add him to the current room.
            result[targetindex].users.push({ name: res.locals.user.name });
            result[targetindex].save();
            res.render('chatrooms/room',{room:result[targetindex]});

        } else {//Now if the client was already in a room, they get deleted from that previous room -> [roomindex] <-.
            result[roomindex].users.splice(result[roomindex].users.findIndex(x => x.name == res.locals.user.name), 1);

            //Then we add him to the current room -> [targetindex] <-.
            result[targetindex].users.push({ name: res.locals.user.name });

            /* Do the saves in sync because we're working on one document so that 
           the client first leaves the previous room, then joins the targeted one. */
            result[roomindex].save(() => {
                result[targetindex].save();
            });
            res.render('chatrooms/room',{room:result[targetindex]});
        }
    });
});
module.exports = router;
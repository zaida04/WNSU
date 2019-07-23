/*
/////////////////////////////////////////////////////////////
/
/           COPYRIGHT ZAID ARSHAD 2018
/           license: Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)(https://creativecommons.org/licenses/by-nc-sa/4.0/)
/
////////////////////////////////////////////////////////////
*/


//begin of declaration of libraries
const express = require("express");//WEBSERVER LIBRARY
const replace = require("replace-in-file");//LIBRARY FOR REPLACING FILE CONTENT
const path = require("path")//LIBRARY FOR FILE DIRECTORY
var bodyParser = require("body-parser"); //PARSING POST URL QUERIES
const fs = require("fs");//FILE SYSTEM
//end of declaration of libraries

//begin of global variables
var app = express();
var port = 80;//PORT
var filedir;//DIRECTORY OF FILE
var nf;
var ide, name, month, date, time, pn, loc; //PARAMETERS 
var options;
//end of global variables

//begin of settings for express
app.use(bodyParser.json()); //USE BODYPARSER
app.use(express.static(__dirname + '/views'));
app.use(bodyParser.urlencoded({extended: true}));
app.set('views', __dirname + '/views'); //SET THE VIEW FOLDER
app.set('view engine', 'pug'); //SET THE VIEW ENGINE
//end of settings for express

app.get("/events", function (req, res) { //LIST OF EVENTS
    if (!fs.existsSync(__dirname + "/events/eventlist.json")) {
        fs.writeFileSync(__dirname + "/events/eventlist.json", JSON.stringify({ "events": [] }))
    }
    var el = JSON.parse(fs.readFileSync(__dirname + "/events/eventlist.json"))
    res.render("index", { els: el.events });
})

//create eent admin only
app.get("/createevent", function (req, res) {
    res.sendFile("/views/createevent.html", { root: __dirname })
})

//the event page
app.get('/events/:eventId', function (req, res) { // RETRIEVE DATA OF EVENT
    filedir = __dirname + `/events/${req.params.eventId}.json`;
    var date = new Date().getFullYear().toString();
    var datate = JSON.parse(fs.readFileSync(filedir));
    res.render("viewpage", { datai: datate, yeari: date, peoplei: datate.people })
})

//redirects to eventss
app.get("/", function (req, res) { //MAIN PAGE REDIRECT TO EVENTS
    if (!fs.existsSync(__dirname + "/events/log.json")) {
        fs.writeFileSync(__dirname + "/events/log.json", JSON.stringify({ "ips": [] }));
        console.log("Log created")
    }
    try {
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        logip(ip);
    } catch (e) {
        console.log("Error logging IP. Log: " + e)
    }
    res.redirect("/events");
})

app.get('/events/:eventId/delete', function (req, res) {
    var data = JSON.parse(fs.readFileSync(__dirname + `/events/${req.params.eventId}.json`))
    res.sendFile("/views/delete.html", { root: __dirname });
})
//the signup for the event page
app.get('/events/:eventId/signup', function (req, res) { //signup
    var datate = JSON.parse(fs.readFileSync(__dirname + `/events/${req.params.eventId}.json`));
    res.render("signup", { datai: datate });
})
app.get('/events/:eventId/:position/delete', function (req, res) {
    res.sendFile("/views/remove.html", {root: __dirname});
})
app.post("/events/addnew", function (req, res) { //MAIN POST FUNCTION - GENERATE EVENT FILE
    ide = req.query.ide || req.body.ide || Math.floor((Math.random() * 10000) + 1000); //e.g. ?id=127852
    name = req.query.name || req.body.name; //e.g. ?name=winterconcert
    month = req.query.month || req.body.month; //e.g. ?month=09
    day = req.query.day || req.body.day; // e.g. ?day=24
    time = req.query.time || req.body.time; //e.g. ?time=5:30
    loc = req.query.loc || req.body.loc;
    pn = req.query.pn || req.body.pn; //positions needed e.g. ?pn=1-3
    nf = __dirname + "/events/" + ide + ".json"; //FILE LOCATIONs
    try {
        if (!fs.existsSync(nf)) {
            fs.copyFileSync(__dirname + "/events/template.json", nf);
            //following code replaces strings in the newly made file that is identical to the template
            replaceall(nf, "templateevent", name);
            replaceall(nf, "monthi", month);
            replaceall(nf, "dayi", day);
            replaceall(nf, "timei", time);
            replaceall(nf, "loci", loc);
            replaceall(nf, "idi", ide);
            if (pn == 1) {
                replaceall(nf, "posi", "Sound Only");
            } else if (pn == 2) {
                replaceall(nf, "posi", "Sound & Lights");
            } else if (pn == 3) {
                replaceall(nf, "posi", "Sound & Lights & Backstage");
            } else {
                throw "INVALID POSITION"
            }
            // end
            addtofile(ide, name); //add to event list 
            res.send(`REQUEST SUCCESSFUL. ID:  + ${ide} + . Write this down. <br><a href='/events/${ide}'>Click here to go to the event</a><br><a href='/'>Click here to go to the home page</a>`); //result send back status
        } else {
            throw "There is already an event with that ID";
        }
    } catch (e) {
        res.render('error', { error: e });
    }
})

app.post('/events/:eventId/delete', function (req, res) {
    fs.unlinkSync(__dirname + `/events/${req.params.eventId}.json`);
    var a = JSON.parse(fs.readFileSync(__dirname + "/events/eventlist.json"));
    for (i = 0; i < a.events.length; i++) {
        if (a.events[i].id == req.params.eventId) {
            a.events.splice(i, 1);
        }
    }
    fs.writeFileSync(__dirname + `/events/eventlist.json`, JSON.stringify(a));
    res.redirect("/events/")
})
app.post('/events/:eventId/:position/delete', function (req, res) {
    var data = JSON.parse(fs.readFileSync(__dirname + `/events/${req.params.eventId}.json`));
    try {
        if (req.params.position == "sound") {
            if (req.body.pass == data.people.soundpass) {
                delete data.people.sound;
                delete data.people.soundpass;
                fs.writeFileSync(__dirname + `/events/${req.params.eventId}.json`, JSON.stringify(data));
                res.redirect(__dirname + `/events/${req.params.eventId}`);
            } else {
                throw "Incorrect Passcode";
            }
        } else if (req.params.position == "lights") {
            if (req.body.pass == data.people.lightpass) {
                delete data.people.lights;
                delete data.people.lightpass;
                fs.writeFileSync(__dirname + `/events/${req.params.eventId}.json`, JSON.stringify(data));
                res.redirect(__dirname + `/events/${req.params.eventId}`);
            } else {
                throw "Incorrect Passcode";
            }
        } else if (req.params.position == "backstage") {
            if (req.body.pass == data.people.backstagepass) {
                delete data.people.backstage;
                delete data.people.backstagepass;
                fs.writeFileSync(__dirname + `/events/${req.params.eventId}.json`, JSON.stringify(data));
                res.redirect(__dirname + `/events/${req.params.eventId}`);
            } else {
                throw "Incorrect Passcode";
            }
        }
    } catch (e) {
        res.render('error', { error: e });
    }
})

//the post url where the data from the event signup page goes to
app.post('/events/:eventId/setpos', function (req, res) {
    try {
        var fname = req.body.name;
        var fpos = req.body.pos;
        var fdata = JSON.parse(fs.readFileSync(__dirname + `/events/${req.params.eventId}.json`));
        var fpass = req.body.pass;
        fname = capitalize(fname);
        if (fpos == "1") {
            if (!('sound' in fdata.people)) {
                if (fname == fdata.people.lights) {
                    throw "You cannot sign up for multiple things"
                } else if (fname == fdata.people.backstage) {
                    throw "You cannot sign up for multiple things"
                } else { 
                    fdata.people.sound = fname;
                    fdata.people.soundpass = fpass;
                }
            } else {
                throw "someone already chose that";
            }
        }
        else if (fpos == "2") {
            if (!(fdata.pos == "Sound Only")) {
                if (!('lights' in fdata.people)) {
                    if (fname == fdata.people.sound) {
                        throw "You cannot sign up for multiple things"
                    } else if (fname == fdata.people.backstage) {
                        throw "You cannot sign up for multiple things"
                    } else {
                        fdata.people.lights = fname;
                        fdata.people.lightpass = fpass;
                    }
                } else {
                    throw "someone already chose that";
                }
            } else {
                throw "Lights is not needed for this event"
            }
        }
        else if (fpos == "3") {
            if (!(fdata.pos == "Sound Only" || fdata == "Sound & Lights")) {
                if (!('backstage' in fdata.people)) {
                    if (fname == fdata.people.sound) {
                        throw "You cannot sign up for multiple things"
                    } else if (fname == fdata.people.lights) {
                        throw "You cannot sign up for multiple things"
                    } else {
                        fdata.people.backstage = fname;
                        fdata.people.backstagepass = fpass;
                    }
                } else {
                    throw "someone already chose that";
                }
            } else {
                throw "Backstage is not needed for this event";
            }
        }
        fs.writeFileSync(__dirname + `/events/${req.params.eventId}.json`, JSON.stringify(fdata));
        res.redirect(`/events/${req.params.eventId}`);
    } catch (e) {
        res.render('error', { error: e });
    }
})


//log the ip of a visitor
function logip(a) {
    var cond = 0;
    var content = JSON.parse(fs.readFileSync(__dirname + '/events/log.json'));
    if (content.ips.length > 0) { //checks if ip is in the system
        for (i = 0; i < content.ips.length; i++) {
            if (content.ips[i].ip == a) {
                content.ips[i].count += 1;
                cond = 1;
            }
        }
    }
    if (cond == 0) {
        content.ips.push({ "ip": a, "count": 1});
    } 
    fs.writeFileSync(__dirname + "/events/log.json", JSON.stringify(content));
    }

//Capitalize the first letter of a word
function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function addtofile(id1, name1) { //ADD TO ARRAY OF EVENTLIST JSON
    if (!fs.existsSync(__dirname + "/events/eventlist.json")) {
        fs.writeFileSync(__dirname + "/events/eventlist.json", JSON.stringify({ "events": [] }))
    }
    var result = JSON.parse(fs.readFileSync(__dirname + "/events/eventlist.json"));
    result.events.unshift({ "id": id1, "name": name1 })
    fs.writeFileSync(__dirname + "/events/eventlist.json", JSON.stringify(result));
}
function replaceall(a, b, c) { //CHANGE CONTENT OF NEW JSON FILE
    options = {
        "files": a,
        "from": b,
        "to": c
    }
    replace.sync(options);
}
//page that has a list of events
app.get('*', function (req, res) {
    res.status(404);
    res.redirect('/');
});

app.listen(port, function() { //START WEBSERVER
    console.log(`The server has started on ${port}`);
})

const fs = require("fs");
const os = require("os");
const DS = require("nedb");
const dialog = require("electron").remote.dialog;
const dateFormat = require('dateformat');

const workdir = os.homedir() + "/.panel/";
let settings = "";
try{
    settings = JSON.parse(fs.readFileSync(workdir + "settings.json", "utf8"));
} catch (e){
    fs.mkdir(workdir, err => {});
    fs.writeFile(workdir + "settings.json", JSON.stringify({database: workdir + "db"}));
    settings = {database: workdir + "db"};
}

let db = new DS({filename: settings.database, autoload: true});

function updateDocList(docs){
    let i;
    for (i in document.getElementsByClassName("document")) {
        if (document.getElementById(i) !== null) {
            document.getElementById(i).remove();
        }
    }
    docs.forEach(function(doc){
        let elem = document.createElement("div");
        elem.innerHTML = doc.title;
        elem.setAttribute("class", "list document");
        elem.setAttribute("id", doc._id);
        switch (doc.type){
            case "docs":
                elem.setAttribute("onclick", "fetchDoc('" + doc._id + "');");
                break;
            default:
                console.log("Doc type undefined: " + doc.type);
        }
        document.getElementById("first").appendChild(elem);
    });
}

function fetchAll(){
    db.find().sort({created: -1}).projection({content: 0}).exec(function(err, docs){
        if (err){
            dialog.showErrorBox("Database Fetch Error", "");
        }
        updateDocList(docs);
    })
}

module.exports = {
    db: db,
    global_import: function(dir) {
        try {
            JSON.parse(fs.readFileSync(dir, "utf8")).forEach(function (value) {
                db.find({_id: value._id}, function (err, docs) {
                    if (err) {
                        dialog.showErrorBox("Database Fetch Error", "");
                    } else {
                        if (docs.length === 0) {
                            db.insert(value);
                        } else {
                            db.update({_id: value._id}, value);
                        }
                    }
                });
                fetchAll();
            });
        } finally {}
    },
    global_export: function(dir) {
        db.find({}, function(err, docs){
            if (err) {
                dialog.showErrorBox("Database Fetch Error", "");
            } else {
                try{
                    fs.writeFile(dir, JSON.stringify(docs));
                } finally {}
            }
        })
    },
    import_single: function() {
        try {
            const loc = dialog.showOpenDialog({
                properties: ['Open File'],
                filters: [{name: 'Panel Article Json File', extensions: ['pjson']}]
            });
            const value = JSON.parse(fs.readFileSync(loc[0], "utf8"));
            db.find({_id: value._id}, function (err, doc) {
                if (err) {
                    dialog.showErrorBox("Database Fetch Error", "");
                } else {
                    if (doc.length === 0) {
                        db.insert(value);
                    } else {
                        db.update({_id: value._id}, value);
                    }
                }
                fetchAll();
            });
        } finally {}
    },
    export_single: function(id) {
        try {
            const loc = dialog.showSaveDialog({filters: [{name: 'Panel Article Json File', extensions: ['pjson']}]})
            db.find({_id: id}, function (err, doc) {
                if (err) {
                    dialog.showErrorBox("Database Fetch Error", "");
                } else {
                    fs.writeFile(loc, JSON.stringify(doc[0]));
                }
            })
        } finally {}
    },/*
    export: function(){
        const header = "<head><link href='src/katex.min.css' rel='stylesheet'><link href='src/editor.css' rel='stylesheet'><script src='src/katex.min.js'></script></head>";
        let options = { format: 'A4' };
        let html = '<html>' + header +  '<body class="ql-editor">' + document.getElementsByClassName("ql-editor")[0].innerHTML + '</body></html>';
        pdf.create(html, options).toFile('./temp.pdf', function(err, res) {
            if (err){
                dialog.showErrorBox("PDF creation failure", "");
            }
        });
    },*/
    newDoc: function(){
        db.insert({type: "docs", title: "Untitled Document", content: "\"\"", tags: [], created: new Date(), modified: new Date()});
        fetchAll();
    },
    updateDoc: function(id, title, content, raw_tags){
        content = JSON.stringify(content);
        db.update({_id: id}, {$set: {title: title, content: content, tags: raw_tags.split(' '), modified: new Date()}});
    },
    fetchAll: fetchAll,
    updateTags: function(){
        let tag = document.getElementById('tags-select').value;
        document.getElementById('tags-select').innerHTML = "<option value=''>all</option>";
        db.find({}, function(err, docs){
            if (err){
                dialog.showErrorBox("Database Fetch Error", "");
            }
            let s =  new Set();
            docs.forEach(function(doc) {
                doc.tags.forEach(function (value) {
                    s.add(value);
                });
            });
            s.forEach(function(value){
                if (tag === value) {
                    document.getElementById('tags-select').innerHTML += "<option value='" + value + "' selected='selected'>" + value + "</option>";
                } else {
                    document.getElementById('tags-select').innerHTML += "<option value='" + value + "'>" + value + "</option>";
                }
            });
        })
    },
    fetchTag: function(){
        tag = document.getElementById('tags-select').value;
        if (tag === "") {
            db.find({type: "docs"}).sort({created: -1}).projection({content: 0}).exec(function(err, docs){
                if (err){
                    dialog.showErrorBox("Database Fetch Error", "");
                }
                updateDocList(docs);
            })
        } else {
            db.find({type: "docs", tags: tag}).sort({created: 1}).projection({content: 0}).exec(function (err, docs) {
                if (err) {
                    dialog.showErrorBox("Database Fetch Error", "");
                }
                updateDocList(docs);
            })
        }
    },
    fetchDoc: function(id){
        db.findOne({type: "docs", _id: id}).exec(function(err, doc){
            if (err){
                dialog.showErrorBox("Database Fetch Error", "");
            }
            document.getElementById("title").value = doc.title;
            document.getElementById("tag").value = doc.tags.join(" ");
            editor.setContents(JSON.parse(doc.content))
        })
    },
    duplicate: function(id) {
        db.findOne({type: "docs", _id: id}).exec(function(err, doc){
            if (err){
                dialog.showErrorBox("Database Fetch Error", "");
            }
            db.insert({type: doc.type, title: doc.title + " duplicate", content: doc.content, tags: doc.tags, created: doc.created, modified: new Date()});
            fetchAll();
        });
    },
    remove: function(id){
        db.remove({_id: id});
        fetchAll();
    },
    properties: function(id){
        db.findOne({_id: id}).exec(function(err, doc){
            dialog.showMessageBox({type: "info", title: doc.title, message: `Created Date: ${dateFormat(doc.created, "ddd, mmm dS yyyy, h:MM:ss TT")}\nModified Date: ${dateFormat(doc.modified, "ddd, mmm dS yyyy, h:MM:ss TT")}\nSize: ${(JSON.stringify(doc).length / 1024).toFixed(2)} KB`});
        });
    }
};

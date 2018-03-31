const db = require('./database.js');
const dialog = require("electron").remote.dialog;
let cur_id = null;
let on_pause = false;
let rightClickClass = null;
db.fetchAll();
db.updateTags();

// quill.js
const quill = require("quill");
let editor = new quill("#editor", {
    theme: "snow",
    modules: {
        formula: true,
        toolbar: [
            [{ header: [1,2,3,4,5,6,false]}],
            ['bold', 'italic', 'underline', 'strike', {'color': []}, {'background': []}],
            [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
            ['link', 'image', 'video', 'formula', 'code-block'],
            [{'script': 'super'}, {'script': 'sub'}, {'align': []}]
        ]
    }
});

// resize the height of the editor
document.getElementById('editor').setAttribute("style", "height: calc(100% - " + (document.getElementById("title").offsetHeight + document.getElementsByClassName('ql-toolbar')[0].offsetHeight) + "px)");
// auto update
const delta = quill.import("delta");
let change = new delta();
editor.on("text-change", function(dt){
    change = change.compose(dt)
});
setInterval(function() {
    if (change.length() > 0 && !on_pause) {
        updateDoc();
        change = new delta();
    }
});

// methods
function updateDoc(){
    if (cur_id !== null){
        let text = editor.getContents();
        let title = document.getElementById("title").value;
        let raw_tags = document.getElementById("tag").value;
        db.updateDoc(cur_id, title, text, raw_tags);
    }
}
function fetchDoc(id){
    document.getElementById("note").hidden = "hidden";
    document.getElementById("document").hidden = "";
    cur_id = id;
    db.fetchDoc(id);
}

function fetchNote(id){
    document.getElementById("document").hidden = "hidden";
    document.getElementById("note").hidden = "";
    cur_id = id;
    db.fetchNote(id);
}

// Renderer send and receive methods
const ipc = require('electron').ipcRenderer;
ipc.on('newDoc', function(event, message) {
    db.newDoc();
    db.fetchAll();
});
ipc.on('import', function(event, message) {
    db.global_import(message[0])
});
ipc.on('export', function(event, message) {
    db.global_export(message)
});
ipc.on('word-count', function(event, message) {
    dialog.showMessageBox({type: "none", title: "Word Count", message: `Words: ${editor.getText().split(' ').length + editor.getLines().length - 1}
Characters: ${editor.getText().length}`});
});

// Right click menu
const remote = require('electron').remote;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;
let docmenu = new Menu();
docmenu.append(new MenuItem({label: 'Duplicate', click: function() {
        db.duplicate(rightClickClass.id);
    }}));
docmenu.append(new MenuItem({label: 'Export', click: function() {
        db.export_single(rightClickClass.id);
    }}));
docmenu.append(new MenuItem({label: 'Remove', click: function() {
        db.remove(rightClickClass.id);
    }}));
docmenu.append(new MenuItem({label: 'Properties', click: function() {
        db.properties(rightClickClass.id);
    }}));
docmenu.append(new MenuItem({type: 'separator'}));
docmenu.append(new MenuItem({label: 'New', submenu: [{
        label: 'Document', click: function (e) {
            db.newDoc();
        }}
    ]}));
docmenu.append(new MenuItem({label: 'Import', click: db.import_single}));
let newdocmenu = new Menu();
newdocmenu.append(new MenuItem({label: 'New', submenu: [{
        label: 'Document', click: function (e) {
            db.newDoc();
        }}
    ]}));
newdocmenu.append(new MenuItem({label: 'Import', click: db.import_single}));
let editormenu = new Menu();
editormenu.append(new MenuItem({label: 'Undo', role: 'undo'}));
editormenu.append(new MenuItem({label: 'Redo', role: 'redo'}));
editormenu.append(new MenuItem({type: 'separator'}));
editormenu.append(new MenuItem({label: 'Cut', role: 'cut'}));
editormenu.append(new MenuItem({label: 'Copy', role: 'copy'}));
editormenu.append(new MenuItem({label: 'Paste', role: 'paste'}));
window.addEventListener('contextmenu', function (e) {
    rightClickClass = e.path[0];
    e.preventDefault();
    switch (rightClickClass.className) {
        case "first":
            newdocmenu.popup(remote.getCurrentWindow());
            break;
        case "":
            editormenu.popup(remote.getCurrentWindow());
            break;
        case "list document":
            docmenu.popup(remote.getCurrentWindow());
            break;
        default:
            break;
    }
}, false);

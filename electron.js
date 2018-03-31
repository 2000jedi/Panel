const electron = require("electron");
const app = electron.app;
const Menu = electron.Menu;
const BrowserWindow = electron.BrowserWindow;
const dialog = electron.dialog;

let mainWindow;

function createWindow(){
    mainWindow=new BrowserWindow();
    mainWindow.loadURL('file://' + __dirname + '/app/index.html');
    mainWindow.on("closed",function(){
        mainWindow = null;
    });

    const template = [{
        label: 'File',
        submenu: [
            {
                label: 'New',
                submenu: [
                    {
                        label: 'Document',
                        accelerator: 'CmdOrCtrl+N',
                        click() {
                            mainWindow.webContents.send('newDoc');
                        }
                    }
                ],
            },
            {
                label: 'Settings',
                accelerator: 'CmdOrCtrl+,',
                click() {
                    console.log("Not Available Yet")
                }
            },
            {
                label: 'Import',
                click() {
                    mainWindow.webContents.send('import', dialog.showOpenDialog(mainWindow, {properties: ['Open File'], filters: [{name: 'Panel Json File', extensions: ['pml']}]}))
                }
            },
            {
                label: 'Export',
                click() {
                    mainWindow.webContents.send('export', dialog.showSaveDialog(mainWindow, {filters: [{name: 'Panel Json File', extensions: ['pml']}]}))
                }
            },
            {
                label: 'Close',
                accelerator: 'CmdOrCtrl+W',
                click() {
                    mainWindow.close();
                }
            },
            {
                label: 'Quit',
                accelerator: 'CmdOrCtrl+Q',
                click() {
                    app.quit();
                }
            }
        ]},
        {
            label: 'Edit',
            submenu: [{
                label: 'Undo',
                accelerator: 'CmdOrCtrl+Z',
                role: 'undo'
            }, {
                label: 'Redo',
                accelerator: 'Shift+CmdOrCtrl+Z',
                role: 'redo'
            }, {
                type: 'separator'
            }, {
                label: 'Cut',
                accelerator: 'CmdOrCtrl+X',
                role: 'cut'
            }, {
                label: 'Copy',
                accelerator: 'CmdOrCtrl+C',
                role: 'copy'
            }, {
                label: 'Paste',
                accelerator: 'CmdOrCtrl+V',
                role: 'paste'
            }, {
                label: 'Select All',
                accelerator: 'CmdOrCtrl+A',
                role: 'selectall'
            }]
        },
        {
            label: "Tools",
            submenu: [{
                label: "Word Count",
                click() {
                    mainWindow.webContents.send("word-count");
                }
            }]
        }/*,
        {
            label: 'Dev',
            accelerator: 'CmdOrCtrl+I',
            click() {
                mainWindow.toggleDevTools();
            }
        }*/
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.on("ready",createWindow);
app.on("window-all-closed",function(){
    if(process.platform !== "darwin"){
        app.quit();
    }
});
app.on("activate",function(){
    if(mainWindow === null){
        createWindow();
    }
});

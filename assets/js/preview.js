const ipc = require('electron').ipcRenderer;

//ipcMain.on("previewWindow:poster", (err, movieName) => {
    // let link = "";
    // const container = document.querySelector('.container');
    // const img = document.createElement('img');
    // img.id = 'poster';
    // img.src = "";

    // console.log(webContents);
    // container.appendChild(img);
    // console.log(link);
//});

ipc.on('message', (event, message) => {
    console.log(message);
});
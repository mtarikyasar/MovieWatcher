const url = require('url');
const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');

let mainWindow, addWindow, searchWindow;

let watchedMovieCount, unwatchedMovieCount;

app.on('ready', () => {
    console.log("Application is running...");
    
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        frame: true,
    });
    
    mainWindow.setResizable(false);
    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, "main.html"),
            protocol:  "file:",
            slashes: true
        })
    );

    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(mainMenu);

    // New Window
    ipcMain.on("key:newWindow", () => {
        createAddWindow();
    });

    mainWindow.on('close', () => {
        app.quit();
    });

    // Add Window Events

    ipcMain.on("addWindow:close", () => {
        addWindow.close();
        addWindow = null;
    });

    ipcMain.on("mainWindow:reload", () => {
        mainWindow.reload();
    });

    ipcMain.on("addWindow:save", (err, movieName, directorName, year, cond) => {
        const appDataDirPath = getAppDataPath();

        //Create appDataDir if not exist
        if (!fs.existsSync(appDataDirPath)){
            fs.mkdirSync(appDataDirPath);
        }

        const appDataFilePath =path.join(appDataDirPath, 'movieList.txt');

        if(movieName || directorName){
            console.log(`Movie Name: ${movieName}\nDirector Name: ${directorName}\nRelease Year: ${year}`);
            let data = `${movieName}#${directorName}#${year}#${cond}\n`;

            fs.appendFile(appDataFilePath, data, (err) => {
                if (err) {
                    console.log("There was a problem saving data.");
                } else{
                    console.log("Data saved correctly.");
                }
            });

            mainWindow.webContents.send("movieList:addItem", movieName, directorName, year, cond);
            addWindow.close();
            addWindow = null;
        }

        mainWindow.reload();
    });

    // Movie Count

    ipcMain.on("key:movieCount", (err, unwatched, watched) =>{
        unwatchedMovieCount = unwatched;
        watchedMovieCount = watched;
    });

    // Search Window Events

    ipcMain.on("searchWindow:close", () => {
        searchWindow.close();
        searchWindow = null;
    });

    ipcMain.on("searchWindow:search", (err, movie, director) => {
        let found = false;

        lineReader.eachLine(appDataFilePath, function (line, last) {
            let res = line.split("#");

            if (movie === res[0] && director === res[1]){
                if (res[3] === true){
                    const options = {
                        buttons: ['Close'],
                        message: `Movie '${movie} exists.\nAnd you watched it.'`,
                    }

                const msg = dialog.showMessageBox(null, options);
                }

                else{
                    const options = {
                        buttons: ['Close'],
                        message: `Movie '${movie} exists.\nAnd you haven't watched it.'`,
                    }

                const msg = dialog.showMessageBox(null, options);
                }
                
                console.log(msg);
                found = true;
            };
        });

        if (found === false){
            const options = {
                buttons: ['Close'],
                message: `Movie '${movie}' doesn't exist on the list.`
            }

            const msg = dialog.showMessageBox(null, options);
            console.log(msg);
        }

        searchWindow.close();
        searchWindow = null;
    });

});

const mainMenuTemplate = [
    {
        label: "File",
        submenu: [
            {
                label: "Add New Movie",
                accelerator: process.platform == "darwin" ? "Command+N" : "Ctrl+N",
                click(){
                    createAddWindow();
                }
            },
            
            {
                label: "Reload",
                role: "reload"
            },
            {
                label: "Quit",
                role: "quit"
            }
        ]
    },
    {
        label: "Tools",
        submenu: [
            {
                label: "Movie Count",
                click(){
                    const options = {
                        buttons: ['Close'],
                        message: `You watched ${watchedMovieCount} movies.\nYou've got ${unwatchedMovieCount} movies to watch.`,
                    }
                    const msg = dialog.showMessageBox(null, options);
                    console.log(msg);
                }
            },
            {
                label: "Search Movie",
                accelerator: process.platform == "darwin" ? "Command+F" : "Ctrl+F",
                click(){
                    createSearchWindow();
                }
            },
            {
                label: "Delete Movie",
                click(){

                }
            }
        ]
    }
];

if (process.platform == "darwin"){
    mainMenuTemplate.unshift({
        label : app.getName(),
        role: "TODO"
    })
}

if (process.env.NODE_ENV !== "production"){
    mainMenuTemplate.push(
        {
            label: "Dev Tools",
            submenu: [
                {
                    label: "Open Dev Window",
                    accelerator: "F12",
                    click(item, focusedWindow){
                            focusedWindow.toggleDevTools();
                    }
                },
            ]
        }
    )
}

function createAddWindow(){
    addWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        width: 450,
        height: 380,
        title: "Add Movie",
        titleBarStyle: "hiddenInset"
    });

    addWindow.setResizable(false);

    addWindow.loadURL(url.format({
        pathname: path.join(__dirname, "/html/addWindow.html"),
        protocol: "file:",
        slashes: true
    }));

    addWindow.on('close', () => {
        addWindow = null;
    })
}

function createSearchWindow(){
    searchWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        width: 450,
        height: 265,
        title: "Search Movie",
        titleBarStyle: "hiddenInset"
    });

    searchWindow.setResizable(false);

    searchWindow.loadURL(url.format({
        pathname: path.join(__dirname, "/html/searchWindow.html"),
        protocol: "file:",
        slashes: true
    }));

    searchWindow.on('close', () => {
        searchWindow = null;
    })
}

function getAppDataPath() {
    switch (process.platform) {
        case "darwin": {
            return path.join(process.env.HOME, "Library", "Application Support", "MovieWatcher");
        }
        case "win32": {
            return path.join(process.env.APPDATA, "MovieWatcher");
        }
        case "linux": {
            return path.join(process.env.HOME, ".MovieWatcher");
        }
        default: {
            console.log("Unsupported platform!");
            process.exit(1);
        }
    }
}

function searchMovie(){

}
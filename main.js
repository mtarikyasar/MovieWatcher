const url = require('url');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { app, BrowserWindow, Menu, ipcMain, dialog, webContents } = require('electron');

let mainWindow, addWindow, searchWindow, previewWindow;
let watchedMovieCount, unwatchedMovieCount;


app.on('ready', () => {
    console.log("Application is running...");
    let done = false; // For checking if search process
    let found;

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
            protocol: "file:",
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

    ipcMain.on("addWindow:close", () => {
        addWindow.close();
        addWindow = null;
    });

    ipcMain.on("mainWindow:reload", () => {
        mainWindow.reload();
    });

    ipcMain.on("addWindow:save", (err, movieName, directorName, year, cond) => {
        const appDataDirPath = getAppDataPath();

        //Create appDataDir if not exist
        if (!fs.existsSync(appDataDirPath)) {
            fs.mkdirSync(appDataDirPath);
        }

        const appDataFilePath = path.join(appDataDirPath, 'movieList.json');

        //Create movieList.txt if it doesn't exist
        if (!fs.existsSync(appDataFilePath)) {
            fs.writeFile(appDataFilePath, '', function (err) {
                if (err) {
                    console.log(err);
                }
            });
        }

        if (movieName || directorName) {
            let movie = {
                name: "",
                director: "",
                year: 0,
                isWatched: false,
                imdbRating: 0,
                posterLink: ""
            };

            console.log(`Movie Name: ${movieName}\n` + `Director Name: ${directorName}\n` + `Release Year: ${year}`)
            let text = "";
            axios.get("http://www.omdbapi.com/?t=" + movieName + "&apikey=43f1f786")
            .then((response) => {
                //console.log(response.data.Poster);
                movie.name = movieName;
                movie.director = directorName;
                movie.year = year;
                movie.isWatched = cond;
                movie.imdbRating = response.data.Ratings[0].Value;
                movie.posterLink = response.data.Poster;

                text = JSON.stringify(movie);

                fs.appendFile(appDataFilePath, text, (err) => {
                    if (err) {
                        console.log("There was a problem saving data.");
                    } else {
                        console.log("Data saved correctly.");
                    }
                });

                })
                .catch((err) => {
                    console.log(err);
                });
                

            fs.readFile(appDataFilePath, function (err, data) {
                if (err) throw err;

                // if (data.includes(text)) {
                //     const options = {
                //         buttons: ['Close'],
                //         message: `Movie '${movieName}' already exists on the list.`,
                //     }

                //     msg = dialog.showMessageBox(null, options);
                // }

                // else {
                    // fs.appendFile(appDataFilePath, text, (err) => {
                    //     if (err) {
                    //         console.log("There was a problem saving data.");
                    //     } else {
                    //         console.log("Data saved correctly.");
                    //     }
                    // });
                // }
            });

            mainWindow.webContents.send("movieList:addItem", movieName, directorName, year, cond);
            addWindow.close();
            addWindow = null;
        }

        mainWindow.reload();
    });

    // Movie Count
    ipcMain.on("key:movieCount", (err, unwatched, watched) => {
        unwatchedMovieCount = unwatched;
        watchedMovieCount = watched;
    });

    // Search Window Events

    ipcMain.on("searchWindow:close", () => {
        searchWindow.close();
        searchWindow = null;
    });

    ipcMain.on("searchWindow:search", (err, movie, director) => {
        const lineReader = require('line-reader');
        const appDataDirPath = getAppDataPath();
        const appDataFilePath = path.join(appDataDirPath, 'movieList.txt');

        lineReader.eachLine(appDataFilePath, function (line, last) {
            let res = line.split("#");
            let msg;

            // Director parameter temporarily disabled
            if (movie === res[0] || movie === res[0].toLowerCase()/* && director === res[1] */) {
                if (res[3] === 'true') {
                    const options = {
                        buttons: ['Close'],
                        message: `Movie '${res[0]}' exists.\nAnd you watched it.`,
                    }

                    msg = dialog.showMessageBox(null, options);
                    done = true;
                }

                else {
                    const options = {
                        buttons: ['Close'],
                        message: `Movie '${res[0]}' exists.\nAnd you haven't watched it.`,
                    }

                    msg = dialog.showMessageBox(null, options);
                }

                found = true;
                console.log(msg);
            };
        });

        if (found !== true) {
            found = false;
        }

        done = true;
        searchWindow.close();
        searchWindow = null;
    });

    if (done === true && found === false) {
        const options = {
            buttons: ['Close'],
            message: `Movie doesn't exist on the list.`
        }

        const msg = dialog.showMessageBox(null, options);
        console.log(msg);
    }

    // Preview Window Events


    ipcMain.on("openWindow:preview", (err, movieName, posterLink) => {
        //createPreviewWindow(movieNamePos);
        const win = new BrowserWindow({ width: 400, height: 600, title: movieName });
        win.setResizable(false);
        win.loadURL(posterLink);
    });

    // mainWindow.webContents.on('did-finish-load', () => {
    //     mainWindow.webContents.send('message', 'hey');
    // });

    ipcMain.on("previewWindow:close", () => {
        previewWindow.close();
        previewWindow = null;
    });
});

const mainMenuTemplate = [
    {
        label: "File",
        submenu: [
            {
                label: "Add New Movie",
                accelerator: process.platform == "darwin" ? "Command+N" : "Ctrl+N",
                click() {
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
                click() {
                    const options = {
                        buttons: ['Close'],
                        message: `You watched ${watchedMovieCount} movies.\n` +
                            `You've got ${unwatchedMovieCount} movies to watch.`
                    }
                    const msg = dialog.showMessageBox(null, options);
                    console.log(msg);
                }
            },
            {
                label: "Search Movie",
                accelerator: process.platform == "darwin" ? "Command+F" : "Ctrl+F",
                click() {
                    createSearchWindow();
                }
            }
        ]
    }
];

if (process.platform == "darwin") {
    mainMenuTemplate.unshift({
        label: app.getName(),
        role: ""
    })
}

if (process.env.NODE_ENV !== "production") {
    mainMenuTemplate.push(
        {
            label: "Developer Tools",
            submenu: [
                {
                    label: "Open Dev Window",
                    accelerator: "F12",
                    click(item, focusedWindow) {
                        focusedWindow.toggleDevTools();
                    }
                },
            ]
        }
    )
}

function createAddWindow() {
    if (process.platform === "win32") {
        addWindow = new BrowserWindow({
            webPreferences: {
                nodeIntegration: true
            },
            width: 500,
            height: 400,
            frame: false,
            backgroundColor: '#FFF',
            title: "Add Movie",
        });
    }

    else {
        addWindow = new BrowserWindow({
            webPreferences: {
                nodeIntegration: true
            },
            width: 450,
            height: 380,
            frame: false,
            title: "Add Movie",
        });
    }

    addWindow.setResizable(false);

    addWindow.loadURL(url.format({
        pathname: path.join(__dirname, "/assets/html/addWindow.html"),
        protocol: "file:",
        slashes: true
    }));

    addWindow.on('close', () => {
        addWindow = null;
    })
}

function createSearchWindow() {
    searchWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        width: 450,
        height: 220,
        frame: false,
        backgroundColor: '#FFF',
        title: "Search Movie",
    });

    searchWindow.setResizable(false);

    searchWindow.loadURL(url.format({
        pathname: path.join(__dirname, "/assets/html/searchWindow.html"),
        protocol: "file:",
        slashes: true
    }));

    searchWindow.on('close', () => {
        searchWindow = null;
    })
}

function createPreviewWindow(movieName) {
    previewWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        width: 400,
        height: 700,
        backgroundColor: '#FFF',
        title: movieName,
    });

    previewWindow.setResizable(false);

    previewWindow.loadURL(url.format({
        pathname: path.join(__dirname, "/assets/html/previewWindow.html"),
        protocol: "file:",
        slashes: true
    }));

    previewWindow.on('close', () => {
        previewWindow = null;
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
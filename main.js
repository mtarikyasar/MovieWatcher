const url = require("url");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { app, BrowserWindow, Menu, ipcMain, dialog } = require("electron");

let mainWindow, addWindow, searchWindow, previewWindow;
let watchedMovieCount, unwatchedMovieCount;

app.on("ready", () => {
    console.log("Application is running...");

    const appDataDirPath = getAppDataPath();
    const appDataFilePath = path.join(appDataDirPath, "movieList.json");

    //Create movieList.json if it doesn't exist
    if (!fs.existsSync(appDataFilePath)) {
        let movie = {
            name: "",
            director: "",
            year: 0,
            isWatched: false,
            imdbRating: 0,
            posterLink: "",
        };
        let text = "[" + JSON.stringify(movie) + "]";
        console.log("movieList.json doesn't exist. Creating...");
        fs.writeFile(appDataFilePath, text, (err) => {
            if (err) {
                console.log(err);
            }
        });
    }

    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
        },
        frame: true,
    });

    mainWindow.setResizable(false);
    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, "main.html"),
            protocol: "file:",
            slashes: true,
        })
    );

    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(mainMenu);

    // New Window
    ipcMain.on("key:newWindow", () => {
        createAddWindow();
    });

    mainWindow.on("close", () => {
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
        const appDataFilePath = path.join(appDataDirPath, "movieList.json");

        let json = require(appDataFilePath);

        if (movieName) {
            let isExist = false;

            for (let i = 0; i < json.length; i++) {
                if (
                    json[i].name === movieName &&
                    json[i].director === directorName
                ) {
                    isExist = true;
                }
            }

            if (!isExist) {
                let movie = {
                    name: "",
                    director: "",
                    year: 0,
                    isWatched: false,
                    imdbRating: 0,
                    posterLink: "",
                };

                console.log(
                    `Movie Name: ${movieName}\n` +
                        `Director Name: ${directorName}\n` +
                        `Release Year: ${year}`
                );

                let text = "";

                axios
                    .get(
                        "http://www.omdbapi.com/?t=" +
                            movieName +
                            "&apikey=43f1f786"
                    )
                    .then((response) => {
                        movie.name = movieName;
                        movie.director = directorName;
                        movie.year = year;
                        if (cond === false) movie.isWatched = "false";
                        else movie.isWatched = "true";
                        movie.imdbRating = response.data.Ratings[0].Value;
                        movie.posterLink = response.data.Poster;

                        json.push(movie);
                        text = JSON.stringify(movie);

                        fs.writeFileSync(
                            appDataFilePath,
                            JSON.stringify(json),
                            (err) => {
                                if (err) {
                                    console.log(
                                        "There was a problem saving data."
                                    );
                                } else {
                                    console.log("Data saved correctly.");
                                }
                            }
                        );
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            } else {
                const options = {
                    buttons: ["Close"],
                    message: `Movie '${movieName}' already exists on the list.`,
                };

                msg = dialog.showMessageBox(null, options);
            }

            // mainWindow.webContents.send(
            //     "movieList:addItem",
            //     movieName,
            //     directorName,
            //     year,
            //     cond
            // );
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

    ipcMain.on("key:searchWindow", () => {
        createSearchWindow();
    });

    ipcMain.on("searchWindow:search", (err, movieName) => {
        let done = false;
        let found = false;
        const appDataDirPath = getAppDataPath();
        const appDataFilePath = path.join(appDataDirPath, "movieList.json");

        let json = require(appDataFilePath);

        for (let i = 0; i < json.length; i++) {
            if (json[i].name === movieName) {
                found = true;

                if (json[i].isWatched === "true") {
                    const options = {
                        buttons: ["Close"],
                        message: `Movie '${json[i].name}' exists.\nAnd you watched it.`,
                    };

                    msg = dialog.showMessageBox(null, options);
                    done = true;
                } else {
                    const options = {
                        buttons: ["Close"],
                        message: `Movie '${json[i].name}' exists.\nAnd you haven't watched it.`,
                    };

                    msg = dialog.showMessageBox(null, options);
                    done = true;
                }
            }
        }

        if (done === true && found === false) {
            const options = {
                buttons: ["Close"],
                message: `Movie ${movieName} doesn't exist on the list.`,
            };

            const msg = dialog.showMessageBox(null, options);
        }

        searchWindow.close();
        searchWindow = null;
    });
    // Preview Window Events

    ipcMain.on("openWindow:preview", (err, posterLink) => {
        createPreviewWindow(posterLink);

        // const win = new BrowserWindow({ width: 400, height: 600 });
        // win.setResizable(false);
        // win.loadURL(posterLink);
    });

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
                accelerator:
                    process.platform == "darwin" ? "Command+N" : "Ctrl+N",
                click() {
                    createAddWindow();
                },
            },

            {
                label: "Reload",
                role: "reload",
            },
            {
                label: "Quit",
                role: "quit",
            },
        ],
    },
    {
        label: "Tools",
        submenu: [
            {
                label: "Movie Count",
                click() {
                    const options = {
                        buttons: ["Close"],
                        message:
                            `You watched ${watchedMovieCount} movies.\n` +
                            `You've got ${unwatchedMovieCount} movies to watch.`,
                    };
                    const msg = dialog.showMessageBox(null, options);
                    console.log(msg);
                },
            },
            {
                label: "Search Movie",
                accelerator:
                    process.platform == "darwin" ? "Command+F" : "Ctrl+F",
                click() {
                    createSearchWindow();
                },
            },
        ],
    },
];

if (process.platform == "darwin") {
    mainMenuTemplate.unshift({
        label: app.getName(),
        role: "",
    });
}

if (process.env.NODE_ENV !== "production") {
    mainMenuTemplate.push({
        label: "Developer Tools",
        submenu: [
            {
                label: "Open Dev Window",
                accelerator: "F12",
                click(item, focusedWindow) {
                    focusedWindow.toggleDevTools();
                },
            },
        ],
    });
}

function createAddWindow() {
    if (process.platform === "win32") {
        addWindow = new BrowserWindow({
            webPreferences: {
                nodeIntegration: true,
            },
            width: 500,
            height: 400,
            frame: false,
            backgroundColor: "#FFF",
            title: "Add Movie",
        });
    } else {
        addWindow = new BrowserWindow({
            webPreferences: {
                nodeIntegration: true,
            },
            width: 450,
            height: 380,
            frame: false,
            title: "Add Movie",
        });
    }

    addWindow.setResizable(false);

    addWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, "/assets/html/addWindow.html"),
            protocol: "file:",
            slashes: true,
        })
    );

    addWindow.on("close", () => {
        addWindow = null;
    });
}

function createSearchWindow() {
    searchWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
        },
        width: 450,
        height: 220,
        frame: false,
        backgroundColor: "#FFF",
        title: "Search Movie",
    });

    searchWindow.setResizable(false);

    searchWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, "/assets/html/searchWindow.html"),
            protocol: "file:",
            slashes: true,
        })
    );

    searchWindow.on("close", () => {
        searchWindow = null;
    });
}

function createPreviewWindow(movieName) {
    const { ipcRenderer } = require("electron");

    previewWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
        },
        width: 400,
        height: 700,
        backgroundColor: "#FFF",
        title: movieName,
    });

    previewWindow.setResizable(false);

    ipcRenderer.send("key:previewMovieDetails", movieName);
    previewWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, "/assets/html/previewWindow.html"),
            protocol: "file:",
            slashes: true,
        })
    );

    previewWindow.on("close", () => {
        previewWindow = null;
    });
}

function getAppDataPath() {
    switch (process.platform) {
        case "darwin": {
            return path.join(
                process.env.HOME,
                "Library",
                "Application Support",
                "MovieWatcher"
            );
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

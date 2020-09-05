const lineReader = require("line-reader");

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

const appDataDirPath = getAppDataPath();
const appDataFilePath = path.join(appDataDirPath, 'movieList.txt');
checkMovieCount();

lineReader.eachLine(appDataFilePath, function (line, last) {
    let res = line.split('#');
    let cond = res[3];

    const container = document.querySelector(".container");
    const rowToWatch = document.getElementById("to-watch");
    const rowWatched = document.getElementById("watched");

    const watchSection = document.createElement("ul");
    watchSection.className = "watch-section";

    const movies = document.createElement("li");

    const movieName = document.createElement("a");
    movieName.className = "movie-name";
    movieName.id = "movieName";
    movieName.innerText = res[0];

    const directorName = document.createElement("a");
    directorName.className = "director-name";
    directorName.id = "directorName";
    directorName.innerText = res[1];

    const movieYear = document.createElement("a");
    movieYear.className = "movie-year";
    movieYear.innerText = res[2];

    const watchSit = document.createElement("a");
    watchSit.innerText = res[3];
    watchSit.hidden = true;

    const but = document.createElement("button");
    const deleteButton = document.createElement("button");
    deleteButton.className = "deleteButton fa fa-trash-o";

    if (cond === 'true') {
        but.innerText = "✘";
        but.className = "change-section cross";
        movies.appendChild(but);
        movies.appendChild(movieName);
        movies.appendChild(directorName);
        movies.appendChild(movieYear);
        movies.appendChild(watchSit);
        movies.appendChild(deleteButton);
        watchSection.appendChild(movies);
        rowWatched.appendChild(watchSection);
        container.appendChild(rowToWatch);
        container.appendChild(rowWatched);
    }

    else if (cond === 'false') {
        but.innerText = "✔";
        but.className = "change-section check";
        movies.appendChild(but);
        movies.appendChild(movieName);
        movies.appendChild(directorName);
        movies.appendChild(movieYear);
        movies.appendChild(watchSit);
        movies.appendChild(deleteButton);
        watchSection.appendChild(movies);
        rowToWatch.appendChild(watchSection);
        container.appendChild(rowToWatch);
        container.appendChild(rowWatched);
    }

    but.addEventListener("click", (e) => {
        let data = `${e.target.nextSibling.innerText}#` + 
                    `${e.target.nextSibling.nextSibling.innerText}#`+ 
                    `${e.target.nextSibling.nextSibling.nextSibling.innerText}#`+ 
                    `${e.target.nextSibling.nextSibling.nextSibling.nextSibling.innerText}`;
        
        let path = fs.readFileSync(appDataFilePath, 'utf-8');
        var newValue;

        if (e.target.nextSibling.nextSibling.nextSibling.nextSibling.innerText === "true") {
            newValue = path.replace(new RegExp(data), `\n${e.target.nextSibling.innerText}#` +
                                                        `${e.target.nextSibling.nextSibling.innerText}#` +
                                                        `${e.target.nextSibling.nextSibling.nextSibling.innerText}#` +
                                                        `false\n`);
        }

        else if (e.target.nextSibling.nextSibling.nextSibling.nextSibling.innerText === "false") {
            newValue = path.replace(new RegExp(data), `\n${e.target.nextSibling.innerText}#` +
                                                        `${e.target.nextSibling.nextSibling.innerText}#` +
                                                        `${e.target.nextSibling.nextSibling.nextSibling.innerText}#` +
                                                        `true\n`);
        }
        fs.writeFileSync(appDataFilePath, newValue, 'utf-8');

        ipcRenderer.send("mainWindow:reload");
    });

    deleteButton.addEventListener("click", (e) => {
        if (confirm(`Are you sure to delete '${e.target.previousSibling.previousSibling.previousSibling.previousSibling.innerText}'`)) {
            let data = `${e.target.previousSibling.previousSibling.previousSibling.previousSibling.innerText}#` +
                        `${e.target.previousSibling.previousSibling.previousSibling.innerText}#` +
                        `${e.target.previousSibling.previousSibling.innerText}#` +
                        `${e.target.previousSibling.innerText}\n`;

            let path = fs.readFileSync(appDataFilePath, 'utf-8');
            var newValue;
            newValue = path.replace(new RegExp(data), '');
            fs.writeFileSync(appDataFilePath, newValue, 'utf-8');
            
            e.target.parentNode.parentNode.remove();
        }
    });

    checkMovieCount();
});

function checkMovieCount() {
    const container = document.querySelector("#to-watch");
    const container2 = document.querySelector("#watched");

    let unwatched = container.childElementCount-1;
    let watched = container2.childElementCount-1;

    ipcRenderer.send("key:movieCount", unwatched, watched);
}
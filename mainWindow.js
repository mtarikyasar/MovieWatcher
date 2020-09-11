const lineReader = require("line-reader");

// let Movie = {
//     name: "",
//     director: "",
//     year: 0,
//     isWatched: false,
//     imdbRating: 0,
//     posterLink: ""
// }

//let Movies = new Array();

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
const appDataFilePath = path.join(appDataDirPath, 'movieList.json');

checkMovieCount();
let MovieArray = [];

let json = require(appDataFilePath);

for (let i = 0; i < json.length; i++) {
    let cond = json[i].isWatched;
    const container = document.querySelector(".container");
    const rowToWatch = document.getElementById("to-watch");
    const rowWatched = document.getElementById("watched");

    const watchSection = document.createElement("ul");
    watchSection.className = "watch-section";

    const movies = document.createElement("li");

    const movieName = document.createElement("a");
    movieName.className = "movie-name";
    movieName.id = "movieName";
    movieName.innerText = json[i].name;

    const poster = document.createElement("img");
    poster.hidden = true;
    poster.className = "movie-poster";
    poster.src = json[i].posterLink;

    const directorName = document.createElement("a");
    directorName.className = "director-name";
    directorName.id = "directorName";
    directorName.innerText = json[i].director;

    const movieYear = document.createElement("a");
    movieYear.className = "movie-year";
    movieYear.innerText = json[i].year;

    const watchSit = document.createElement("a");
    watchSit.innerText = json[i].isWatched;
    watchSit.hidden = true;

    const previewButton = document.createElement("button");
    previewButton.className = "previewButton fa fa-eye"

    const but = document.createElement("button");
    const deleteButton = document.createElement("button");
    deleteButton.className = "deleteButton fa fa-trash-o";

    if (cond === 'true') {
        but.innerText = "✘";
        but.className = "change-section cross";
        movies.appendChild(but);
        movies.appendChild(poster);
        movies.appendChild(movieName);
        movies.appendChild(directorName);
        movies.appendChild(movieYear);
        // movies.appendChild(watchSit);
        movies.appendChild(previewButton);
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
        movies.appendChild(poster);
        movies.appendChild(movieName);
        movies.appendChild(directorName);
        movies.appendChild(movieYear);
        // movies.appendChild(watchSit);
        movies.appendChild(previewButton);
        movies.appendChild(deleteButton);
        watchSection.appendChild(movies);
        rowToWatch.appendChild(watchSection);
        container.appendChild(rowToWatch);
        container.appendChild(rowWatched);
    }

    but.addEventListener("click", (e) => {
        console.log(json[i].isWatched);
        let data = `${e.target.nextSibling.innerText}#` +
            `${e.target.nextSibling.nextSibling.innerText}#` +
            `${e.target.nextSibling.nextSibling.nextSibling.innerText}#` +
            `${e.target.nextSibling.nextSibling.nextSibling.nextSibling.innerText}`;

        let path = fs.readFileSync(appDataFilePath, 'utf-8');
        var newValue;

        if (json[i].isWatched === "true") {
            console.log(json[i].name + " " + json[i].isWatched);
            json[i].isWatched = "false";
        }

        else if (json[i].isWatched === "false") {
            console.log(json[i].name + " " + json[i].isWatched);
            json[i].isWatched = "true";
        }

        fs.writeFileSync(appDataFilePath, JSON.stringify(json), 'utf-8');
        ipcRenderer.send("mainWindow:reload");
    });

    previewButton.addEventListener("click", (e) => {
        ipcRenderer.send("openWindow:preview", json[i].posterLink);
        // ipcRenderer.send("previewWindow:poster", res[0]);
    });

    deleteButton.addEventListener("click", (e) => {
        if (confirm(`Are you sure to delete '${json[i].name}'`)) {
            json.splice(i, 1);
            fs.writeFileSync(appDataFilePath, JSON.stringify(json), 'utf-8');
            e.target.parentNode.parentNode.remove();
        }
    });

    checkMovieCount();
}

function checkMovieCount() {
    const container = document.querySelector("#to-watch");
    const container2 = document.querySelector("#watched");

    let unwatched = container.childElementCount - 1;
    let watched = container2.childElementCount - 1;

    ipcRenderer.send("key:movieCount", unwatched, watched);
}
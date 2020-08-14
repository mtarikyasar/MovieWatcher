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

const appDatatDirPath = getAppDataPath();
const appDataFilePath = path.join(appDatatDirPath, 'movieList.txt');
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
    
    if (cond === 'true'){
        but.innerText = "✘";
        but.className = "change-section cross";
        movies.appendChild(but);
        movies.appendChild(movieName);
        movies.appendChild(directorName);
        movies.appendChild(movieYear);
        movies.appendChild(watchSit);
        watchSection.appendChild(movies);
        rowWatched.appendChild(watchSection);
        container.appendChild(rowToWatch);
        container.appendChild(rowWatched);
    }

    else if (cond === 'false'){
        but.innerText = "✔";
        but.className = "change-section check";
        movies.appendChild(but);
        movies.appendChild(movieName);
        movies.appendChild(directorName);
        movies.appendChild(movieYear);
        movies.appendChild(watchSit);
        watchSection.appendChild(movies);
        rowToWatch.appendChild(watchSection);
        container.appendChild(rowToWatch);
        container.appendChild(rowWatched);
    } 

    but.addEventListener("click", (e) => {
        //checkBookCount();
        let data = `${e.target.nextSibling.innerText}#${e.target.nextSibling.nextSibling.innerText}#${e.target.nextSibling.nextSibling.nextSibling.innerText}#${e.target.nextSibling.nextSibling.nextSibling.nextSibling.innerText}`;
        let path = fs.readFileSync(appDataFilePath, 'utf-8');
        var newValue;
        
        if (e.target.nextSibling.nextSibling.nextSibling.nextSibling.innerText === "true"){
            newValue = path.replace(new RegExp(data), `\n${e.target.nextSibling.innerText}#${e.target.nextSibling.nextSibling.innerText}#${e.target.nextSibling.nextSibling.nextSibling.innerText}#false\n`);
        }

        else if (e.target.nextSibling.nextSibling.nextSibling.nextSibling.innerText === "false"){
            newValue = path.replace(new RegExp(data), `\n${e.target.nextSibling.innerText}#${e.target.nextSibling.nextSibling.innerText}#${e.target.nextSibling.nextSibling.nextSibling.innerText}#true\n`);

        }
        fs.writeFileSync(appDataFilePath, newValue, 'utf-8');
        
        ipcRenderer.send("mainWindow:reload");
    });

    checkMovieCount();
});

// ipcRenderer.on("bookList:addItem", (e, name, writer, cond) => {
//     console.log(bookList);
//     // Containert
//     const container = document.querySelector(".container");
    
//     // Row
//     const row = document.getElementById("to-read");

//     // Read Section
//     const readSection = document.createElement("ul");
//     readSection.className = "read-section";
    
//     // elements
//     const books = document.createElement("li");
    
//     // Book name
//     const bookName = document.createElement("a");
//     bookName.className = "book-name";
//     bookName.innerText = name;
    
//     const writerName = document.createElement("a");
//     writerName.className = "writer-name";
//     writerName.innerText = writer;
    
//     // Button
//     const but = document.createElement("button");

//     if (cond === false){
//         but.innerText = "✔";
//         but.className = "change-section check";
//     }

//     else{
//         but.innerText = "✘";
//         but.className = "change-section cross";
//     }
    
//     but.addEventListener("click", () => {
//         checkBookCount();
//     });
    
//     books.appendChild(but);
//     books.appendChild(bookName);
//     books.appendChild(writerName);
//     readSection.appendChild(books);
//     row.appendChild(readSection);
//     container.appendChild(row);

//     /*
//     // Watch out for the parent
//     deleteBtn.addEventListener("click", (e) => {
//         if (confirm("r u sure???")){
//             e.target.parentNode.parentNode.remove();
//             checkBookCount();
//         }
//     })
//     */
// });

function checkMovieCount(){
    const container = document.querySelector("#to-watch");
    const container2 = document.querySelector("#watched");

    let unwatched = container.childElementCount;
    let watched = container2.childElementCount;

    ipcRenderer.send("key:movieCount", unwatched, watched);
}

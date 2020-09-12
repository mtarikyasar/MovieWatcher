const { ipcMain } = require("electron");

ipcMain.on("key:previewMovieDetails", (err, movieName) => {
    document.write("<h1>" + movieName + "</h1>");
    // let link = "";
    // const container = document.querySelector(".container");
    // const img = document.createElement("img");
    // img.id = "poster";
    // img.src = "";

    // console.log(webContents);
    // container.appendChild(img);
    // console.log(link);
});

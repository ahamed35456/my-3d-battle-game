const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

const players = new Map();

let nextUID = 10000001;

function createUID() {
    let uid;

    do {
        uid = String(nextUID++);
    } while (uid === "11111111");

    return uid;
}

app.post("/register", (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {
        return res.json({
            success: false,
            message: "Username and password are required."
        });
    }

    for (const player of players.values()) {

        if (
            player.username.toLowerCase() ===
            username.toLowerCase()
        ) {
            return res.json({
                success: false,
                message: "Username already exists."
            });
        }
    }

    const uid =
        username.toLowerCase() === "admin"
            ? "11111111"
            : createUID();

    players.set(uid, {
        uid,
        username,
        password
    });

    res.json({
        success: true,
        uid,
        username
    });
});

app.post("/login", (req, res) => {

    const { username, password } = req.body;

    for (const player of players.values()) {

        if (
            player.username === username &&
            player.password === password
        ) {
            return res.json({
                success: true,
                uid: player.uid,
                username: player.username
            });
        }
    }

    res.json({
        success: false,
        message: "Wrong username or password."
    });
});

io.on("connection", socket => {

    console.log("Player connected:", socket.id);

    socket.on("joinGame", data => {

        socket.uid = data.uid;
        socket.username = data.username;

        socket.broadcast.emit("playerJoined", {
            uid: socket.uid,
            username: socket.username
        });

        console.log(
            socket.username +
            " joined the game."
        );
    });

    socket.on("disconnect", () => {

        if (socket.uid) {

            socket.broadcast.emit(
                "playerLeft",
                socket.uid
            );
        }

        console.log("Player disconnected.");
    });
});

server.listen(PORT, "0.0.0.0", () => {

    console.log("");
    console.log("================================");
    console.log("   MY 3D BATTLE GAME SERVER");
    console.log("================================");
    console.log("");
    console.log(
        "Server running on port: " + PORT
    );
    console.log("");
});
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

const players = new Map();

let nextUID = 10000001;


/* =========================
   UID SYSTEM
========================= */

function createUID() {

    let uid;

    do {
        uid = String(nextUID++);

    } while (uid === "11111111");

    return uid;
}


/* =========================
   REGISTER
========================= */

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
        password,

        friends: [],
        requests: [],

        socketId: null

    });


    res.json({

        success: true,
        uid,
        username

    });

});


/* =========================
   LOGIN
========================= */

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


/* =========================
   GET PLAYER
========================= */

function getPlayer(uid) {

    return players.get(String(uid));

}


/* =========================
   FRIEND LIST
========================= */

function sendFriendList(uid) {

    const player = getPlayer(uid);

    if (!player) {
        return;
    }


    const friends = player.friends.map(friendUID => {

        const friend = getPlayer(friendUID);

        if (!friend) {
            return null;
        }


        return {

            uid: friend.uid,

            username: friend.username,

            online: friend.socketId !== null

        };

    }).filter(Boolean);


    io.to(player.socketId).emit(
        "friendList",
        friends
    );

}


/* =========================
   SOCKET CONNECTION
========================= */

io.on("connection", socket => {

    console.log(
        "Player connected:",
        socket.id
    );


    /* =====================
       JOIN GAME
    ===================== */

    socket.on("joinGame", data => {

        const player =
            getPlayer(data.uid);


        if (!player) {

            console.log(
                "Unknown player tried to join:",
                data.uid
            );

            return;

        }


        player.socketId =
            socket.id;


        socket.uid =
            player.uid;

        socket.username =
            player.username;


        console.log(
            player.username +
            " joined the game."
        );


        /* Send current friends */

        sendFriendList(player.uid);


        /* Tell friends this player is online */

        for (
            const friendUID of player.friends
        ) {

            const friend =
                getPlayer(friendUID);


            if (
                friend &&
                friend.socketId
            ) {

                io.to(friend.socketId).emit(
                    "friendStatus",
                    {
                        uid: player.uid,
                        username: player.username,
                        online: true
                    }
                );

            }

        }

    });


    /* =====================
       ADD FRIEND
    ===================== */

    socket.on("addFriend", data => {

        const player =
            getPlayer(socket.uid);


        if (!player) {
            return;
        }


        const targetUID =
            String(data.uid || "").trim();


        if (!targetUID) {

            socket.emit(
                "friendMessage",
                "Enter a UID."
            );

            return;

        }


        if (
            targetUID === player.uid
        ) {

            socket.emit(
                "friendMessage",
                "You cannot add yourself."
            );

            return;

        }


        const target =
            getPlayer(targetUID);


        if (!target) {

            socket.emit(
                "friendMessage",
                "UID not found."
            );

            return;

        }


        if (
            player.friends.includes(target.uid)
        ) {

            socket.emit(
                "friendMessage",
                "This player is already your friend."
            );

            return;

        }


        if (
            target.requests.includes(player.uid)
        ) {

            socket.emit(
                "friendMessage",
                "Friend request already sent."
            );

            return;

        }


        target.requests.push(
            player.uid
        );


        socket.emit(
            "friendMessage",
            "Friend request sent to " +
            target.username +
            "."
        );


        /* Notify target if online */

        if (target.socketId) {

            io.to(target.socketId).emit(
                "friendRequest",
                {
                    uid: player.uid,
                    username: player.username
                }
            );

        }

    });


    /* =====================
       ACCEPT FRIEND
    ===================== */

    socket.on("acceptFriend", data => {

        const player =
            getPlayer(socket.uid);


        if (!player) {
            return;
        }


        const friendUID =
            String(data.uid);


        const friend =
            getPlayer(friendUID);


        if (!friend) {
            return;
        }


        if (
            !player.requests.includes(friendUID)
        ) {

            return;

        }


        /* Remove request */

        player.requests =
            player.requests.filter(
                uid => uid !== friendUID
            );


        /* Add both players */

        if (
            !player.friends.includes(friendUID)
        ) {

            player.friends.push(
                friendUID
            );

        }


        if (
            !friend.friends.includes(player.uid)
        ) {

            friend.friends.push(
                player.uid
            );

        }


        sendFriendList(player.uid);


        if (friend.socketId) {

            sendFriendList(friend.uid);


            io.to(friend.socketId).emit(
                "friendMessage",
                player.username +
                " accepted your friend request."
            );

        }


        socket.emit(
            "friendMessage",
            "Friend added: " +
            friend.username
        );

    });


    /* =====================
       REJECT FRIEND
    ===================== */

    socket.on("rejectFriend", data => {

        const player =
            getPlayer(socket.uid);


        if (!player) {
            return;
        }


        const friendUID =
            String(data.uid);


        player.requests =
            player.requests.filter(
                uid => uid !== friendUID
            );


        socket.emit(
            "friendMessage",
            "Friend request rejected."
        );

    });


    /* =====================
       GET REQUESTS
    ===================== */

    socket.on("getFriendRequests", () => {

        const player =
            getPlayer(socket.uid);


        if (!player) {
            return;
        }


        const requests =
            player.requests.map(uid => {

                const requester =
                    getPlayer(uid);


                if (!requester) {
                    return null;
                }


                return {

                    uid: requester.uid,

                    username:
                        requester.username

                };

            }).filter(Boolean);


        socket.emit(
            "friendRequests",
            requests
        );

    });


    /* =====================
       REFRESH FRIENDS
    ===================== */

    socket.on("getFriends", () => {

        sendFriendList(socket.uid);

    });


    /* =====================
       DISCONNECT
    ===================== */

    socket.on("disconnect", () => {

        const player =
            getPlayer(socket.uid);


        if (!player) {

            console.log(
                "Player disconnected."
            );

            return;

        }


        /* Only mark offline if
           this is the active socket */

        if (
            player.socketId === socket.id
        ) {

            player.socketId =
                null;

        }


        /* Tell friends */

        for (
            const friendUID of player.friends
        ) {

            const friend =
                getPlayer(friendUID);


            if (
                friend &&
                friend.socketId
            ) {

                io.to(friend.socketId).emit(
                    "friendStatus",
                    {
                        uid: player.uid,
                        username: player.username,
                        online: false
                    }
                );

                sendFriendList(
                    friend.uid
                );

            }

        }


        console.log(
            player.username +
            " disconnected."
        );

    });

});


/* =========================
   SERVER
========================= */

server.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log("");
        console.log(
            "================================"
        );
        console.log(
            "   MY 3D BATTLE GAME SERVER"
        );
        console.log(
            "================================"
        );
        console.log("");

        console.log(
            "Server running on port: " +
            PORT
        );

        console.log("");

    }
);
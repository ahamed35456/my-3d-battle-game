```javascript
// =====================================================
// MY BATTLE GAME
// SIMPLE BR PROTOTYPE
// =====================================================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x87ceeb);


// =====================================================
// CAMERA
// =====================================================

const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    500
);


// =====================================================
// RENDERER
// =====================================================

const renderer = new THREE.WebGLRenderer({
    antialias: false
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(1);

document.body.appendChild(renderer.domElement);


// =====================================================
// LIGHT
// =====================================================

const sun = new THREE.DirectionalLight(
    0xffffff,
    2
);

sun.position.set(
    50,
    80,
    50
);

scene.add(sun);

scene.add(
    new THREE.AmbientLight(
        0xffffff,
        0.7
    )
);


// =====================================================
// GROUND
// =====================================================

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(
        200,
        200
    ),
    new THREE.MeshLambertMaterial({
        color: 0x3d963d
    })
);

ground.rotation.x =
    -Math.PI / 2;

scene.add(ground);


// =====================================================
// PLAYER
// =====================================================

const player = new THREE.Group();


// BODY

const body = new THREE.Mesh(
    new THREE.BoxGeometry(
        0.8,
        1.3,
        0.5
    ),
    new THREE.MeshLambertMaterial({
        color: 0x263238
    })
);

body.position.y = 1.1;

player.add(body);


// HEAD

const head = new THREE.Mesh(
    new THREE.SphereGeometry(
        0.32,
        12,
        12
    ),
    new THREE.MeshLambertMaterial({
        color: 0xc98b68
    })
);

head.position.y = 2.0;

player.add(head);


// LEGS

const legMaterial =
    new THREE.MeshLambertMaterial({
        color: 0x151515
    });

const leg1 = new THREE.Mesh(
    new THREE.BoxGeometry(
        0.25,
        0.8,
        0.3
    ),
    legMaterial
);

leg1.position.set(
    -0.2,
    0.4,
    0
);

player.add(leg1);


const leg2 = new THREE.Mesh(
    new THREE.BoxGeometry(
        0.25,
        0.8,
        0.3
    ),
    legMaterial
);

leg2.position.set(
    0.2,
    0.4,
    0
);

player.add(leg2);


// =====================================================
// GUN
// =====================================================

const gun = new THREE.Group();

const gunBody = new THREE.Mesh(
    new THREE.BoxGeometry(
        0.18,
        0.18,
        1.2
    ),
    new THREE.MeshLambertMaterial({
        color: 0x202020
    })
);

gunBody.rotation.x =
    Math.PI / 2;

gunBody.position.z =
    -0.6;

gun.add(gunBody);


const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(
        0.04,
        0.04,
        0.6,
        8
    ),
    new THREE.MeshLambertMaterial({
        color: 0x111111
    })
);

barrel.rotation.x =
    Math.PI / 2;

barrel.position.z =
    -1.4;

gun.add(barrel);

gun.position.set(
    0.45,
    1.35,
    -0.35
);

player.add(gun);

scene.add(player);


// =====================================================
// PLAYER VARIABLES
// =====================================================

let health = 100;

let ammo = 30;

let kills = 0;

const maxAmmo = 30;

const movementSpeed = 0.16;


// =====================================================
// BOTS
// =====================================================

const bots = [];

function createBot(x, z, number) {

    const bot = new THREE.Group();


    const botBody = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.8,
            1.3,
            0.5
        ),
        new THREE.MeshLambertMaterial({
            color: 0xb52b2b
        })
    );

    botBody.position.y = 1.1;

    bot.add(botBody);


    const botHead = new THREE.Mesh(
        new THREE.SphereGeometry(
            0.32,
            12,
            12
        ),
        new THREE.MeshLambertMaterial({
            color: 0xc98b68
        })
    );

    botHead.position.y = 2;

    bot.add(botHead);


    bot.position.set(
        x,
        0,
        z
    );


    bot.userData.health = 100;

    bot.userData.alive = true;

    bot.userData.number = number;


    scene.add(bot);

    bots.push(bot);
}


// Create 10 bots

for (let i = 1; i <= 10; i++) {

    let x;
    let z;

    do {

        x =
            (Math.random() - 0.5) * 100;

        z =
            (Math.random() - 0.5) * 100;

    } while (
        Math.abs(x) < 10 &&
        Math.abs(z) < 10
    );

    createBot(
        x,
        z,
        i
    );
}


// =====================================================
// KEYBOARD
// =====================================================

const keys = {};

document.addEventListener(
    "keydown",
    function(event) {

        keys[
            event.key.toLowerCase()
        ] = true;


        if (
            event.key.toLowerCase() === "r"
        ) {

            reload();

        }

    }
);


document.addEventListener(
    "keyup",
    function(event) {

        keys[
            event.key.toLowerCase()
        ] = false;

    }
);


// =====================================================
// PLAYER MOVEMENT
// =====================================================

function updatePlayer() {

    if (keys["w"]) {

        player.position.z -=
            movementSpeed;

    }

    if (keys["s"]) {

        player.position.z +=
            movementSpeed;

    }

    if (keys["a"]) {

        player.position.x -=
            movementSpeed;

    }

    if (keys["d"]) {

        player.position.x +=
            movementSpeed;

    }

}


// =====================================================
// SHOOTING
// =====================================================

let lastShot = 0;

const shotDelay = 180;


function shoot() {

    const now =
        Date.now();


    if (
        now - lastShot <
        shotDelay
    ) {

        return;

    }


    lastShot = now;


    if (ammo <= 0) {

        return;

    }


    ammo--;


    let closest = null;

    let closestDistance = Infinity;


    for (
        const bot of bots
    ) {

        if (
            !bot.userData.alive
        ) {

            continue;

        }


        const distance =
            player.position.distanceTo(
                bot.position
            );


        if (
            distance <
            closestDistance
        ) {

            closestDistance =
                distance;

            closest =
                bot;

        }

    }


    if (
        closest &&
        closestDistance < 30
    ) {

        closest.userData.health -= 25;


        if (
            closest.userData.health <= 0
        ) {

            closest.userData.alive =
                false;

            closest.visible =
                false;

            kills++;

        }

    }


    updateHUD();

}


// =====================================================
// MOUSE
// =====================================================

document.addEventListener(
    "mousedown",
    function(event) {

        if (
            event.button === 0
        ) {

            shoot();

        }

    }
);


// =====================================================
// RELOAD
// =====================================================

function reload() {

    ammo = maxAmmo;

    updateHUD();

}


// =====================================================
// BOT MOVEMENT
// =====================================================

function updateBots() {

    for (
        const bot of bots
    ) {

        if (
            !bot.userData.alive
        ) {

            continue;

        }


        const distance =
            bot.position.distanceTo(
                player.position
            );


        if (
            distance < 40
        ) {

            const direction =
                new THREE.Vector3();

            direction.subVectors(
                player.position,
                bot.position
            );

            direction.normalize();


            bot.position.x +=
                direction.x * 0.025;

            bot.position.z +=
                direction.z * 0.025;

        }

    }

}


// =====================================================
// CAMERA
// =====================================================

function updateCamera() {

    const desiredX =
        player.position.x;

    const desiredY = 4;

    const desiredZ =
        player.position.z + 8;


    camera.position.x +=
        (
            desiredX -
            camera.position.x
        ) * 0.1;


    camera.position.y +=
        (
            desiredY -
            camera.position.y
        ) * 0.1;


    camera.position.z +=
        (
            desiredZ -
            camera.position.z
        ) * 0.1;


    camera.lookAt(
        player.position.x,
        1,
        player.position.z
    );

}


// =====================================================
// HUD
// =====================================================

function updateHUD() {

    document.getElementById(
        "health"
    ).textContent =
        health;


    document.getElementById(
        "ammo"
    ).textContent =
        ammo;


    document.getElementById(
        "kills"
    ).textContent =
        kills;


    let aliveBots = 0;


    for (
        const bot of bots
    ) {

        if (
            bot.userData.alive
        ) {

            aliveBots++;

        }

    }


    document.getElementById(
        "bots"
    ).textContent =
        aliveBots;

}


// =====================================================
// GAME LOOP
// =====================================================

function animate() {

    requestAnimationFrame(
        animate
    );


    updatePlayer();

    updateBots();

    updateCamera();

    updateHUD();


    renderer.render(
        scene,
        camera
    );

}


camera.position.set(
    0,
    4,
    8
);


updateHUD();

animate();


// =====================================================
// RESIZE
// =====================================================

window.addEventListener(
    "resize",
    function() {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

    }
);
```
s
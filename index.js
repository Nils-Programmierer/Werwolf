const menuButton = document.getElementById("menuButton");
const menu = document.getElementById("menu");

menuButton.addEventListener("click", () => {
    menu.classList.toggle("open");
    menuButton.classList.toggle("open");
});

document.addEventListener("click", (event) => {
    if (!menu.contains(event.target) && !menuButton.contains(event.target)) {
        menu.classList.remove("open");
        menuButton.classList.remove("open");
    }
});


function ShowError(message) {
    const errorContainer = document.createElement("div");
    errorContainer.id = "errorMessage";
    errorContainer.textContent = message;
    errorContainer.classList.add("error-message");

    document.body.appendChild(errorContainer);

    setTimeout(() => {
        document.body.removeChild(errorContainer);
    }, 3000);
}

const roleIds = {
    "Dorfbewohner": "villagerCount",
    "Werwolf": "werewolfCount",
    "Seher": "seerCount",
    "Hexe": "witchCount",
    "Jäger": "hunterCount",
    "Amor": "cupidCount",
    "Leibwächter": "bodyguardCount",
    "Wolfsjunge": "wolf_cubCount",
    "Weißer Wolf": "white_wolfCount",
    "Bäcker": "bakerCount",
    "Dorfmatratze": "village_slutCount",
    "Magd": "maidCount",
    "Kleines Mädchen": "little_girlCount",
    "Bürgermeister": "mayorCount"
};
const playerForm = document.getElementById("playerForm");
let players = [];
let characterCount = 2;


function loadFromLocalStorage() {
    const storedPlayers = localStorage.getItem("players");
    const storedRoles = localStorage.getItem("roles");

    if (storedPlayers) {
        const players = JSON.parse(storedPlayers);

        players.forEach(playerName => {
            addPlayer(playerName);
        });
    }

    if (storedRoles) {
        const roles = JSON.parse(storedRoles);

        let totalRoles = roles.reduce((total, [, count]) => total + count, 0);

        if (roles.some(([roleName, count]) => roleName.toLowerCase() === "bürgermeister" && count > 0)) {
            totalRoles = totalRoles - 1;
        }

        document.getElementById("counterCharacter").textContent = `${totalRoles} Rollen`;

        roles.forEach(([roleName, count]) => {
            const elementId = roleIds[roleName];

            if (!elementId) {
                console.warn(`Keine HTML-ID für Rolle "${roleName}" gefunden.`);
                return;
            }

            const countElement = document.getElementById(elementId);

            if (countElement) {
                countElement.textContent = `${count}x ${roleName}`;
            }
        });

        characterCount = totalRoles;
    }
}


if (playerForm) {
    playerForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const playerInput = document.getElementById("playerInput");
        const playerName = playerInput.value.trim();

        if (playerName) {
            addPlayer(playerName);
            playerInput.value = "";
        }
    });
}

function addPlayer(playerName) {
    const playerListDisplay = document.getElementById("playerListDisplay");

    if (players.map(p => p.toLowerCase()).includes(playerName.toLowerCase())) {
        return;
    }

    players.push(playerName);

    const listItem = document.createElement("li");
    listItem.classList.add("player-item");
    listItem.textContent = playerName;
    listItem.dataset.playerName = playerName;

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Löschen";
    deleteButton.classList.add("delete-btn");
    deleteButton.addEventListener("click", () => {
        deletePlayer(playerName);
    });

    listItem.appendChild(deleteButton);
    playerListDisplay.appendChild(listItem);
    UpdatePlayerCount();
}


function deletePlayer(playerName) {
    const playerListDisplay = document.getElementById("playerListDisplay");

    const index = players.findIndex(p => p.toLowerCase() === playerName.toLowerCase());

    if (index !== -1) {
        players.splice(index, 1);

        const listItem = Array.from(playerListDisplay.children).find(li => li.dataset.playerName === playerName);
        if (listItem) {
            playerListDisplay.removeChild(listItem);
            UpdatePlayerCount();
        }
    }
}



function UpdatePlayerCount() {
    const counter = document.getElementById("counterPlayer");

    if (counter) {
        const playerCount = players.length;
        counter.textContent = `${playerCount} Spieler`;
    }
}

function UpdateCharacterCount(change) {
    const counter = document.getElementById("counterCharacter");

    if (counter) {
        characterCount += parseInt(change);
        counter.textContent = characterCount === 1 ? `${characterCount} Rolle` : `${characterCount} Rollen`;
    }
}

function removeCharacter(characterName) {
    const count = document.getElementById(characterName + "Count");

    if (count) {
        const currentCount = parseInt(count.textContent) || 0;
        const characterNameGerman = count.textContent.replace(/^\d+x\s*/, '');

        if (currentCount > 0) {
            count.textContent = `${currentCount - 1}x ${characterNameGerman}`;

            if (characterNameGerman.toLowerCase() !== "bürgermeister") {
                UpdateCharacterCount('-1');
            }
        }
    }
}

function addCharacter(characterName) {
    const count = document.getElementById(characterName + "Count");

    if (count) {
        const currentCount = parseInt(count.textContent) || 0;
        const characterNameGerman = count.textContent.replace(/^\d+x\s*/, '');

        if (characterNameGerman.toLowerCase() === "bürgermeister" && currentCount >= 1) {
            ShowError("Es darf nur einen Bürgermeister geben.");
            return;
        }

        count.textContent = `${currentCount + 1}x ${characterNameGerman}`;

        if (characterNameGerman.toLowerCase() !== "bürgermeister") {
            UpdateCharacterCount('+1')
        }
    }
}


const startGameButton = document.getElementById("startGameButton");
if (startGameButton) {
    startGameButton.addEventListener("click", () => {
        if (players.length < 4) {
            ShowError("Bitte füge mindestens 4 Spieler hinzu, bevor du das Spiel startest.");
            return;
        }

        if (players.length !== characterCount) {
            ShowError(`Die Anzahl der Spieler (${players.length}) muss der Anzahl der Rollen (${characterCount}) entsprechen.`);
            return;
        }

        const roles = GetRoles();

        const hasWerewolf = roles.some(([roleName, count]) => roleName.toLowerCase() === "werwolf" && count > 0);

        if (!hasWerewolf) {
            ShowError("Es muss mindestens einen Werwolf geben.");
            return;
        }

        const goodRoles = [
            "dorfbewohner",
            "seher",
            "hexe",
            "jäger",
            "amor",
            "leibwächter",
            "bäcker",
            "dorfmatratze",
            "magd",
            "kleines mädchen",
            "bürgermeister"
        ];
        const hasGoodPerson = roles.some(([roleName, count]) => {
            const lowerRoleName = roleName.toLowerCase();
            return goodRoles.includes(lowerRoleName) && count > 0;
        });

        if (!hasGoodPerson) {
            ShowError("Es muss mindestens eine gute Person geben.");
            return;
        }

        assignRolesToPlayers(roles, players);
    });
}


function GetRoles() {
    const roles = [];
    const roleElements = document.querySelectorAll(".character-item p");

    roleElements.forEach((roleElement) => {
        const text = roleElement.textContent.trim();
        const match = text.match(/^(\d+)x\s*(.+)$/);

        if (!match) {
            return;
        }

        const count = Number(match[1]);
        const roleName = match[2].trim();

        roles.push([roleName, count]);
    });
    return roles;
}

function assignRolesToPlayers(roles, players) {
    const roleList = [];

    roles.forEach(([roleName, count]) => {
        if (roleName.trim().toLowerCase() === "bürgermeister") {
            return;
        }

        for (let i = 0; i < count; i++) {
            roleList.push(roleName);
        }
    });

    shuffleArray(roleList);

    const playerNumbers = shuffleArray(
        Array.from({ length: players.length }, (_, index) => index + 1)
    );

    const playerRoles = players.map((player, index) => {
        const playerRole = {
            player: player,
            role: roleList[index]
        };

        playerRole.playerNumber = playerNumbers[index];
        return playerRole;
    });

    const playerRolesJSON = JSON.stringify(playerRoles);

    localStorage.setItem("players", JSON.stringify(players));
    localStorage.setItem("roles", JSON.stringify(roles));
    localStorage.setItem("playerRoles", playerRolesJSON);

    localStorage.removeItem("currentRoleIndex");

    window.location.href = "getRoles.html";
}


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}


const resetGameButton = document.getElementById("resetGameButton");
if (resetGameButton) {
    resetGameButton.addEventListener("click", () => {
        localStorage.removeItem("players");
        localStorage.removeItem("roles");
        localStorage.removeItem("playerRoles");
        window.location.reload();
    });
}

// getRoles.html functions
async function NextRole() {
    const playerRolesJSON = localStorage.getItem("playerRoles");
    if (!playerRolesJSON) {
        console.error("Keine Spielerrollen im Local Storage gefunden.");
        window.location.href = "index.html";
        return;
    }

    const playerRoles = JSON.parse(playerRolesJSON);

    if (playerRoles.length === 0) {
        console.error("Keine Spielerrollen im Local Storage gefunden.");
        window.location.href = "index.html";
        return;
    }

    const currentIndex = parseInt(localStorage.getItem("currentRoleIndex")) || 0;

    if (currentIndex >= playerRoles.length) {
        localStorage.removeItem("currentRoleIndex");
        window.location.href = "game.html";
        return;
    }

    if (currentIndex === (playerRoles.length - 1)) {
        const nextButton = document.getElementById("nextRoleButton");
        if (nextButton) {
            nextButton.textContent = "Spiel starten";
        }
    }

    const currentPlayerRole = playerRoles[currentIndex];

    // Karte auf Vorderseite drehen
    const card = document.getElementById("card");
    if (card && card.classList.contains("flipped")) {
        card.classList.remove("flipped");
    }

    setTimeout(() => {
        const playerNameElement = document.getElementById("name");
        const roleNameElement = document.getElementById("role-name");
        const roleDescriptionElement = document.getElementById("role-description");
        const roleImageElement = document.getElementById("role-image");

        if (playerNameElement && roleNameElement) {
            playerNameElement.textContent = currentPlayerRole.player.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
            roleNameElement.textContent = currentPlayerRole.playerNumber
                ? `${currentPlayerRole.role} (Spieler ${currentPlayerRole.playerNumber})`
                : currentPlayerRole.role;
            roleDescriptionElement.href = `instructions.html#${roleIds[currentPlayerRole.role].toLowerCase().replace(/ /g, "_").replace("count", "Card")}`;
            roleImageElement.src = `img/roles/${roleIds[currentPlayerRole.role].toLowerCase().replace(/ /g, "_").replace("count", "")}.jpg`;
        }

        localStorage.setItem("currentRoleIndex", currentIndex + 1);
    }, 500);
}

function flipCard() {
    const card = document.getElementById("card");
    card.classList.toggle("flipped");
}
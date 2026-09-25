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

        const totalRoles = roles.reduce((total, [, count]) => total + count, 0);
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
    }
}


const playerForm = document.getElementById("playerForm");
let players = [];
let characterCount = 2;

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
        for (let i = 0; i < count; i++) {
            roleList.push(roleName);
        }
    });

    shuffleArray(roleList);

    const playerRoles = players.map((player, index) => {
        return {
            player: player,
            role: roleList[index]
        };
    });

    const playerRolesJSON = JSON.stringify(playerRoles);
    console.log("Assigned Roles:", playerRolesJSON);

    localStorage.setItem("players", JSON.stringify(players));
    localStorage.setItem("roles", JSON.stringify(roles));
    localStorage.setItem("playerRoles", playerRolesJSON);

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
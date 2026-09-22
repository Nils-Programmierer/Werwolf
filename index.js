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
            UpdateCharacterCount('-1');
        }
    }
}

function addCharacter(characterName) {
    const count = document.getElementById(characterName + "Count");

    if (count) {
        const currentCount = parseInt(count.textContent) || 0;
        const characterNameGerman = count.textContent.replace(/^\d+x\s*/, '');

        count.textContent = `${currentCount + 1}x ${characterNameGerman}`;
        UpdateCharacterCount('+1');
    }
}
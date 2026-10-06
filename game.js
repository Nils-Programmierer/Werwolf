let playerRoles = [];
let choicesInTheNight = {
    ["Amor"]: [],
    ["Seher"]: [],
    ["HexeHeal"]: [],
    ["HexePoison"]: [],
    ["Leibwächter"]: [],
    ["Bäcker"]: [],
    ["Dorfmatratze"]: []
};
let choicesLastNight = {}; // z.B. ["Bäcker"]: [[4, 2]]
let lovers = [];
let potionWitch = [];
let werewolfVictimCount = 1;
let step = 0;
let round = 0;
let wastVoting = false;
let withMajor = false;
let mayorPlayerNumber = null;

const task = document.getElementById("task");

let textToSpeech = null;
let voiceStyle = null;

const MODEL_BASE_URL = "https://huggingface.co/Supertone/supertonic-3/resolve/main/onnx";
import { loadTextToSpeech, loadVoiceStyle, writeWavFile } from "./helper.js";


function updateLoading(title, text, progress = null) {
    const loadingTitle = document.getElementById("loadingTitle");
    const loadingText = document.getElementById("loadingText");
    const loadingProgress = document.getElementById("loadingProgress");
    const loadingPercentage = document.getElementById("loadingPercentage");

    if (loadingTitle) {
        loadingTitle.textContent = title;
    }

    if (loadingText) {
        loadingText.textContent = text;
    }

    if (progress !== null) {
        const percentage = Math.max(0, Math.min(100, progress));

        if (loadingProgress) {
            loadingProgress.style.width = `${percentage}%`;
        }

        if (loadingPercentage) {
            loadingPercentage.textContent = `${Math.round(percentage)} %`;
        }
    }
}


function hideLoadingScreen() {
    const loadingScreen = document.getElementById("loadingScreen");

    if (loadingScreen) {
        loadingScreen.classList.add("hidden");
    }
}



async function LoadData() {
    const playerRolesJSON = localStorage.getItem("playerRoles");
    const rolesJSON = localStorage.getItem("roles");

    if (playerRolesJSON) {
        playerRoles = JSON.parse(playerRolesJSON);
    }

    if (!playerRoles || playerRoles.length === 0) {
        console.error("No player roles found in localStorage.");
        window.location.href = "index.html";
        return;
    }

    if (rolesJSON) {
        const roles = JSON.parse(rolesJSON);

        if (roles.some(([role, count]) => role === "Bürgermeister" && count > 0)) {
            withMajor = true;
        }
    }

    console.log("Loaded playerRoles:", playerRoles);
    console.log("Bürgermeister included:", withMajor);
}



async function initSpeech() {
    if (textToSpeech) return;

    console.log("Lade Supertonic...");

    updateLoading(
        "Sprachengine wird geladen...",
        "Lade Supertonic...",
        20
    );

    const result = await loadTextToSpeech(
        MODEL_BASE_URL,
        {
            executionProviders: ["webgpu", "wasm"],
            graphOptimizationLevel: "all"
        },
        (model, current, total) => {
            console.log(
                `Lade Modell ${current}/${total}: ${model}`
            );

            const modelProgress =
                total > 0
                    ? current / total
                    : 0;

            const progress =
                20 + modelProgress * 65;

            updateLoading(
                "Sprachengine wird geladen...",
                `${model} (${current}/${total})`,
                progress
            );
        }
    );

    textToSpeech = result.textToSpeech;

    updateLoading(
        "Stimme wird geladen...",
        "Lade Sprachstil...",
        90
    );

    voiceStyle = await loadVoiceStyle([
        "https://huggingface.co/Supertone/supertonic-3/resolve/main/voice_styles/M1.json"
    ]);

    updateLoading(
        "Fast geschafft...",
        "Sprachengine ist bereit.",
        97
    );

    console.log("Supertonic bereit!");
}


async function initGame() {
    try {
        await LoadData();
        await initSpeech();

        console.log("Spiel und TTS vollständig geladen.");
        hideLoadingScreen();
        document.getElementById("startSection").style.display = "block";
    } catch (error) {
        console.error("Fehler beim Starten:", error);
    }
}

initGame();


document.getElementById("startButton").addEventListener("click", async () => {
    document.getElementById("startSection").style.display = "none";
    await speech("Willkommen zum Spiel Werwolf.");
    await StartNight();
});


async function StartNight() {
    round++;
    step = 0;
    task.textContent = "Die Nacht beginnt. Alle Spieler schlafen ein.";
    await speech("Die Nacht beginnt. Alle Spieler schlafen ein.");
    await WakeUpAtNight();
}


async function WakeUpAtNight() {
    step++;

    // Amor
    if (step === 1 && round === 1 && playerRoles.some(player => player.role === "Amor")) {
        // Für jede Amor Rolle

        for (const amor of playerRoles.filter(player => player.role === "Amor")) {
            const amorPlayerNumber = amor.playerNumber;

            task.textContent = "Der Amor, Spieler " + amorPlayerNumber + ", wacht auf.";
            await speech("Als erstes wacht der Amor, Spieler " + amorPlayerNumber + ", auf. Bitte wähle zwei Spieler, die ein Liebespaar werden sollen.");
            const [numberOfLovers, numberOfLovers2] = await showSelection("Wer soll das Liebespaar werden?", 2, playerRoles.filter(player => player.playerNumber !== amorPlayerNumber).map(player => player.playerNumber), false);
            lovers.push([numberOfLovers, numberOfLovers2]);
            choicesInTheNight["Amor"].push([amorPlayerNumber, numberOfLovers, numberOfLovers2]);

            task.textContent = "Bitte schließe nun die Augen und schlafe wieder ein.";
            await speech("Bitte schließe nun die Augen und schlafe wieder ein.");
        }
    }


    // Liebespaar
    if (step === 2 && round === 1 && playerRoles.some(player => player.role === "Amor")) {
        // Für jedes Liebespaar, das vom Amor gewählt wurde

        for (const lover of lovers) {
            const lover1 = playerRoles.find(player => player.playerNumber === lover[0]).player;
            const lover2 = playerRoles.find(player => player.playerNumber === lover[1]).player;

            task.textContent = lover1.charAt(0).toUpperCase() + lover1.slice(1) + " und " + lover2.charAt(0).toUpperCase() + lover2.slice(1) + " dürfen sich ineinander verlieben.";

            await speech(`Der Amor hat seine Wahl getroffen. Die beiden Spieler sind nun ein Liebespaar. Spieler ${lover[0]} und Spieler ${lover[1]} dürfen aufwachen und sich ineinander verlieben.`);
            await new Promise(resolve => setTimeout(resolve, 5000));

            task.textContent = "Bitte schließt nun die Augen und schlaft wieder ein.";
            await speech("Das Liebespaar hat sich nun unsterblich ineinander verliebt. Es darf nun wieder schlafen gehen.");
        }
    }


    // Werwölfe
    if (step === 3 && playerRoles.some(player => player.role === "Werwolf")) {
        task.textContent = "Die Werwölfe wachen auf.";
        await speech(`Die Werwölfe wachen auf. Bitte wählt gemeinsam ${werewolfVictimCount == 1 ? "ein" : werewolfVictimCount} Opfer, ${werewolfVictimCount == 1 ? "das" : "die"} in dieser Nacht sterben ${werewolfVictimCount == 1 ? "soll" : "sollen"}.`);

        const possibleVictims = playerRoles.filter(player => player.role !== "Werwolf" && player.role !== "Wolfsjunge" && player.role !== "Weißer Wolf").map(player => player.playerNumber);
        const victim = await showSelection(`Die Werwölfe dürfen ${werewolfVictimCount == 1 ? "ein" : werewolfVictimCount} Opfer wählen.`, werewolfVictimCount, possibleVictims, false);
        choicesInTheNight["Werwolf"] = victim;

        task.textContent = "Bitte schließt nun die Augen und schlaft wieder ein.";
        await speech(`Die Werwölfe haben ${werewolfVictimCount == 1 ? "ein" : werewolfVictimCount} Opfer gewählt. Bitte schließt nun die Augen und schlaft wieder ein.`);
    }


    // Seher
    if (step === 4 && playerRoles.some(player => player.role === "Seher")) {
        // Für jede Seher Rolle

        for (const seer of playerRoles.filter(player => player.role === "Seher")) {
            const seerPlayerNumber = seer.playerNumber;

            task.textContent = "Der Seher, Spieler " + seerPlayerNumber + ", wacht auf.";
            await speech("Der Seher, Spieler " + seerPlayerNumber + ", wacht auf. Bitte wähle einen Spieler, dessen Rolle du erfahren möchtest.");

            const [seerChoice] = await showSelection("Wähle einen Spieler aus, dessen Rolle du erfahren möchtest.", 1, playerRoles.filter(player => player.playerNumber !== seerPlayerNumber).map(player => player.playerNumber), false);
            choicesInTheNight["Seher"].push([seerChoice, seerPlayerNumber]);
            let seerRole = playerRoles.find(player => player.playerNumber === seerChoice).role;

            if (seerRole === "Werwolf" || seerRole === "Wolfsjunge" || seerRole === "Weißer Wolf") {
                seerRole = "böse";
            } else {
                seerRole = "gut"
            }

            task.textContent = `${playerRoles.find(player => player.playerNumber === seerChoice).player.charAt(0).toUpperCase() + playerRoles.find(player => player.playerNumber === seerChoice).player.slice(1)} ist ${seerRole}.`;
            await speech(`Die Rolle von diesem Spieler wird dir nun verraten.`);

            await new Promise(resolve => setTimeout(resolve, 5000));
            task.textContent = "Bitte schließe nun die Augen und schlafe wieder ein.";
            await speech("Bitte schließe nun die Augen und schlafe wieder ein.");
        }
    }


    // Hexe
    if (step === 5 && playerRoles.some(player => player.role === "Hexe")) {

        // Für jede Hexe Rolle
        for (const witch of playerRoles.filter(player => player.role === "Hexe")) {
            const witchPlayerNumber = witch.playerNumber;

            task.textContent = "Die Hexe, Spieler " + witchPlayerNumber + ", wacht auf.";
            await speech(`Die Hexe, Spieler ${witchPlayerNumber}, wacht auf. ${choicesInTheNight["Werwolf"].length > 1 ? "Die Opfer der Werwölfe werden dir nun verraten." : "Das Opfer der Werwölfe wird dir nun verraten."}`);

            if (choicesInTheNight["Werwolf"].length > 1) {
                task.textContent = "Opfer der Werwölfe: " + choicesInTheNight["Werwolf"].map(victim => playerRoles.find(player => player.playerNumber === victim).player.charAt(0).toUpperCase() + playerRoles.find(player => player.playerNumber === victim).player.slice(1)).join(", ");
            } else {
                task.textContent = "Opfer der Werwölfe: " + playerRoles.find(player => player.playerNumber === choicesInTheNight["Werwolf"][0]).player.charAt(0).toUpperCase() + playerRoles.find(player => player.playerNumber === choicesInTheNight["Werwolf"][0]).player.slice(1);
            }
            await new Promise(resolve => setTimeout(resolve, 5000));

            const hasHealOnPlayer = potionWitch.some(
                ([potion, playerId]) => potion === "heal" && playerId === witchPlayerNumber
            );

            if (!hasHealOnPlayer) {
                await speech(`Du darfst nun entscheiden, ob du deinen Heiltrank einsetzen möchtest, um ${choicesInTheNight["Werwolf"].length > 1 ? "ein" : "das"} Opfer zu retten.`);
                const [witchChoiceHeal] = await showTwoSelection("Möchtest du deinen Heiltrank einsetzen?", 1, ["Heiltrank", "Kein Heiltrank"]);

                if (witchChoiceHeal === "Heiltrank") {
                    await speech("Du darfst nun entscheiden, welchen Spieler du mit deinem Heiltrank retten möchtest.");
                    const [witchHealChoice] = await showSelection("Wähle einen Spieler, den du mit deinem Heiltrank retten möchtest.", 1, choicesInTheNight["Werwolf"], false);
                    choicesInTheNight["HexeHeal"].push([witchHealChoice, witchPlayerNumber]);
                    potionWitch.push(["heal", witchPlayerNumber]);

                    task.textContent = "Du hast deinen Heiltrank eingesetzt.";
                    await speech("Du hast deinen Heiltrank eingesetzt.");
                }
            }

            const hasPoisonOnPlayer = potionWitch.some(
                ([potion, playerId]) => potion === "poison" && playerId === witchPlayerNumber
            );

            if (!hasPoisonOnPlayer) {
                await speech("Du darfst nun entscheiden, ob du deinen Gifttrank einsetzen möchtest, um einen Spieler zu töten.");
                const [witchChoicePoison] = await showTwoSelection("Möchtest du deinen Gifttrank einsetzen?", 1, ["Gifttrank", "Kein Gifttrank"]);

                if (witchChoicePoison === "Gifttrank") {
                    await speech("Du darfst nun entscheiden, welchen Spieler du mit deinem Gifttrank töten möchtest.");
                    const [witchPoisonChoice] = await showSelection("Wähle einen Spieler, den du mit deinem Gifttrank töten möchtest.", 1, playerRoles.filter(player => player.playerNumber !== witchPlayerNumber).map(player => player.playerNumber), false);
                    choicesInTheNight["HexePoison"].push([witchPoisonChoice, witchPlayerNumber]);
                    potionWitch.push(["poison", witchPlayerNumber]);

                    task.textContent = "Du hast deinen Gifttrank eingesetzt.";
                    await speech("Du hast deinen Gifttrank eingesetzt.");
                }
            }

            task.textContent = "Bitte schließe nun die Augen und schlafe wieder ein.";
            await speech("Bitte schließe nun die Augen und schlafe wieder ein.");
        }
    }


    // Leibwächter
    if (step === 6 && playerRoles.some(player => player.role === "Leibwächter")) {

        //Für jede Leibwächter Rolle
        for (const bodyguard of playerRoles.filter(player => player.role === "Leibwächter")) {
            const bodyguardPlayerNumber = bodyguard.playerNumber;

            task.textContent = "Der Leibwächter, Spieler " + bodyguardPlayerNumber + ", wacht auf.";
            await speech("Der Leibwächter, Spieler " + bodyguardPlayerNumber + ", wacht auf. Bitte wähle einen Spieler, den du schützen möchtest.");

            const [bodyguardChoice] = await showSelection("Wähle einen Spieler aus, den du schützen möchtest.", 1, playerRoles.map(player => player.playerNumber).filter(playerNumber => !(choicesLastNight?.["Leibwächter"] ?? []).some(pair => Array.isArray(pair) && pair[1] === bodyguardPlayerNumber && pair[0] === playerNumber)), false);
            choicesInTheNight["Leibwächter"].push([bodyguardChoice, bodyguardPlayerNumber]);

            task.textContent = "Bitte schließe nun die Augen und schlafe wieder ein.";
            await speech("Bitte schließe nun die Augen und schlafe wieder ein.");
        }
    }


    // Bäcker
    if (step === 7 && playerRoles.some(player => player.role === "Bäcker")) {

        // Für jede Bäcker Rolle
        for (const baker of playerRoles.filter(player => player.role === "Bäcker")) {
            const bakerPlayerNumber = baker.playerNumber;

            task.textContent = "Der Bäcker, Spieler " + bakerPlayerNumber + ", wacht auf.";
            await speech("Der Bäcker, Spieler " + bakerPlayerNumber + ", wacht auf. Bitte wähle einen Spieler, den du in dieser Nacht das Maul stopfen möchtest.");

            const [bakerChoice] = await showSelection("Wähle einen Spieler aus, den du das Maul stopfen möchtest.", 1, playerRoles.map(player => player.playerNumber).filter(playerNumber => playerNumber !== bakerPlayerNumber && !(choicesLastNight?.["Bäcker"] ?? []).some(pair => Array.isArray(pair) && pair[1] === bakerPlayerNumber && pair[0] === playerNumber)), false);
            choicesInTheNight["Bäcker"].push([bakerChoice, bakerPlayerNumber]);

            task.textContent = "Bitte schließe nun die Augen und schlafe wieder ein.";
            await speech("Bitte schließe nun die Augen und schlafe wieder ein.");
        }
    }


    // Dorfmatratze
    if (step === 8 && playerRoles.some(player => player.role === "Dorfmatratze")) {
        // Für jede Dorfmatratze Rolle

        for (const villageSlut of playerRoles.filter(player => player.role === "Dorfmatratze")) {
            const villageSlutPlayerNumber = villageSlut.playerNumber;

            task.textContent = "Die Dorfmatratze, Spieler " + villageSlutPlayerNumber + ", wacht auf.";
            await speech("Die Dorfmatratze, Spieler " + villageSlutPlayerNumber + ", wacht auf. Bitte wähle einen Spieler, bei dem du in dieser Nacht schlafen möchtest.");

            const [villageSlutChoice] = await showSelection("Wähle einen Spieler aus, bei dem du schlafen möchtest.", 1, playerRoles.map(player => player.playerNumber).filter(playerNumber => playerNumber !== villageSlutPlayerNumber && !(choicesLastNight?.["Dorfmatratze"] ?? []).some(pair => Array.isArray(pair) && pair[1] === villageSlutPlayerNumber && pair[0] === playerNumber)), false);
            choicesInTheNight["Dorfmatratze"].push([villageSlutChoice, villageSlutPlayerNumber]);

            task.textContent = "Bitte schließe nun die Augen und schlafe wieder ein.";
            await speech("Bitte schließe nun die Augen und schlafe wieder ein.");
        }
    }



    // Falls noch jemand aufzuwecken ist, dann wird die nächste Rolle aufgeweckt
    if (step < 8) {
        await WakeUpAtNight();
    } else {
        task.textContent = "Die Nacht ist vorbei. Alle Spieler wachen auf.";
        await speech("Die Nacht ist vorbei. Alle Spieler wachen auf.");
        wastVoting = false;
        await MakeDay();
    }
}


function showSelection(promptText, numberOfSelections, playerNumbers, allowNoOne) {
    return new Promise((resolve) => {
        const userSelection = document.getElementById("selectionButtons");
        task.textContent = promptText;
        const selectedPlayers = [];

        playerRoles.forEach(player => {
            if (!playerNumbers.includes(player.playerNumber)) {
                return;
            }

            const button = document.createElement("button");
            button.classList.add("selectionButton");
            button.type = "button";
            button.textContent = player.player.charAt(0).toUpperCase() + player.player.slice(1);

            button.addEventListener("click", async () => {
                if (selectedPlayers.includes(player.playerNumber)) {
                    return;
                }

                selectedPlayers.push(player.playerNumber);
                button.disabled = true;

                if (selectedPlayers.length >= numberOfSelections) {
                    userSelection.innerHTML = "";
                    task.textContent = "";
                    await speech("Eine Entscheidung wurde getroffen.");
                    resolve(selectedPlayers);
                }
            });

            userSelection.appendChild(button);
        });

        if (allowNoOne) {
            const noOneButton = document.createElement("button");
            noOneButton.classList.add("selectionButton");
            noOneButton.type = "button";
            noOneButton.textContent = "Niemand";

            noOneButton.addEventListener("click", async () => {
                userSelection.innerHTML = "";
                task.textContent = "";
                await speech("Es wurde entschieden, dass niemand sterben soll.");
                resolve([]);
            });

            userSelection.appendChild(noOneButton);
        }
    });
}


function showTwoSelection(promptText, numberOfSelections, options) {
    return new Promise((resolve) => {
        const userSelection = document.getElementById("selectionButtons");
        task.textContent = promptText;
        const selectedOptions = [];

        options.forEach(option => {
            const button = document.createElement("button");
            button.classList.add("selectionButton");
            button.type = "button";
            button.textContent = option;

            button.addEventListener("click", async () => {
                if (selectedOptions.includes(option)) {
                    return;
                }

                selectedOptions.push(option);
                button.disabled = true;

                if (selectedOptions.length >= numberOfSelections) {
                    userSelection.innerHTML = "";
                    task.textContent = "";
                    await speech("Eine Entscheidung wurde getroffen.");
                    resolve(selectedOptions);
                }
            });

            userSelection.appendChild(button);
        });
    });
}



async function MakeDay() {
    const deadPlayers = MakeResultNight();
    console.log("Tote Spieler:", deadPlayers);
    console.log("Anzahl der Opfer der Werwölfe für die nächste Nacht:", werewolfVictimCount);
    //ShowResultNight(deadPlayers); //TODO: Falls Magd noch lebt, noch nicht die Rollen verraten, sondern erst wenn die Magd ablehnt, dann die Rollen verraten


    // Zeige Ergebnis Bäcker
    const bakerVictims = choicesInTheNight["Bäcker"].map(pair => pair[0]);
    const uniqueBakerVictims = [...new Set(bakerVictims)];

    if (uniqueBakerVictims.length > 0) {
        await ShowResultBaker(uniqueBakerVictims);
    }


    // Nächste Nacht vorbereiten
    choicesInTheNight = {
        ["Amor"]: [],
        ["Seher"]: [],
        ["HexeHeal"]: [],
        ["HexePoison"]: [],
        ["Leibwächter"]: [],
        ["Bäcker"]: [],
        ["Dorfmatratze"]: []
    };

    // Ist ein Jäger gestorben, dann darf der Jäger noch einen Spieler erschießen, bevor er stirbt -> Spieler aktualisieren, die noch leben
    const shotPlayers = [];

    // Für jeden Jäger, der gestorben ist
    for (let i = 0; i < deadPlayers.length; i++) {
        const hunterPlayerNumber = deadPlayers[i];
        const hunter = playerRoles.find(player => player.playerNumber === hunterPlayerNumber);

        if (hunter?.role !== "Jäger") continue;
        const alivePlayers = playerRoles.map(player => player.playerNumber).filter(playerNumber => !deadPlayers.includes(playerNumber));

        // Niemand mehr übrig, den der Jäger erschießen kann
        if (alivePlayers.length === 0) {
            GameOver();
            return;
        }

        task.textContent = "Der Jäger, Spieler " + hunterPlayerNumber + ", ist gestorben. Bitte wähle einen Spieler, den du noch erschießen möchtest.";
        await speech("Der Jäger, Spieler " + hunterPlayerNumber + ", ist gestorben. Bitte wähle einen Spieler, den du noch erschießen möchtest.");

        const [hunterVictim] = await showSelection("Der Jäger, Spieler " + hunterPlayerNumber + " ist gestorben. Bitte wähle einen Spieler, den du noch erschießen möchtest.", 1, alivePlayers.filter(playerNumber => !shotPlayers.includes(playerNumber)), false);
        shotPlayers.push(hunterVictim);
        deadPlayers.push(hunterVictim);

        //TODO: await ShowResultHunter(hunterPlayerNumber, hunterVictim); //--> Falls Magd noch lebt, kann sie die Rolle übernehmen, sonst Rolle verraten

        // Falls das Opfer des Jägers ein Liebespaar ist, dann stirbt auch der Partner des Liebespaares
        for (const [a, b] of lovers) {
            const partner = a === hunterVictim ? b : b === hunterVictim ? a : null;

            if (partner !== null && !deadPlayers.includes(partner)) {
                deadPlayers.push(partner);
                console.log(`Spieler ${partner} ist das Liebespaar von Spieler ${hunterVictim} und stirbt ebenfalls.`);
                //TODO: await ShowResultLove(hunterVictim, partner); //--> Falls Magd noch lebt, kann sie die Rolle übernehmen, sonst Rolle verraten
            }
        }
    }

    playerRoles = playerRoles.filter(player => !deadPlayers.includes(player.playerNumber));
    console.log("Spieler nach dem Jäger:", playerRoles);


    // Spiel ist vorbei?
    if (await IsGameOver()) {
        GameOver();
        return;
    }


    // Bürgermeisterwahl erste Runde
    if (round === 1 && withMajor && mayorPlayerNumber === null) {
        task.textContent = "Es ist Zeit für die Bürgermeisterwahl. Bitte wählt einen Spieler, der Bürgermeister werden soll.";
        await speech("Es ist Zeit für die Bürgermeisterwahl. Bitte wählt einen Spieler, der Bürgermeister werden soll.");

        const [mayorChoice] = await showSelection("Es ist Zeit für die Bürgermeisterwahl. Bitte wählt einen Spieler, der Bürgermeister werden soll.", 1, playerRoles.map(player => player.playerNumber), false);
        mayorPlayerNumber = mayorChoice;

        task.textContent = `${playerRoles.find(p => p.playerNumber === mayorChoice).player.charAt(0).toUpperCase() + playerRoles.find(p => p.playerNumber === mayorChoice).player.slice(1)} ist nun der Bürgermeister.`;
        await speech(`${playerRoles.find(p => p.playerNumber === mayorChoice).player.charAt(0).toUpperCase() + playerRoles.find(p => p.playerNumber === mayorChoice).player.slice(1)} ist nun der Bürgermeister.`);
    }


    // Bürgermeister ist gestorben -> Amt weitergeben
    if (withMajor && mayorPlayerNumber !== null && !playerRoles.some(player => player.playerNumber === mayorPlayerNumber)) {
        const alivePlayers = playerRoles.map(player => player.playerNumber);
        task.textContent = "Der Bürgermeister ist gestorben. Der alte Bürgermeister darf nun seinen Nachfolger bestimmen.";
        await speech("Der Bürgermeister ist gestorben. Der alte Bürgermeister darf nun seinen Nachfolger bestimmen.");

        const [newMayorChoice] = await showSelection("Der Bürgermeister ist gestorben. Der alte Bürgermeister darf nun seinen Nachfolger bestimmen.", 1, alivePlayers, false);
        mayorPlayerNumber = newMayorChoice;

        task.textContent = `${playerRoles.find(p => p.playerNumber === newMayorChoice).player.charAt(0).toUpperCase() + playerRoles.find(p => p.playerNumber === newMayorChoice).player.slice(1)} ist nun der neue Bürgermeister.`;
        await speech(`${playerRoles.find(p => p.playerNumber === newMayorChoice).player.charAt(0).toUpperCase() + playerRoles.find(p => p.playerNumber === newMayorChoice).player.slice(1)} ist nun der neue Bürgermeister.`);
    }


    // Abstimmung
    if (!wastVoting) {
        const [lynchChoice] = await StartVoting();
        choicesInTheNight["Werwolf"] = [lynchChoice];
        wastVoting = true;
        MakeDay();
        return;
    }


    StartNight();
}


function MakeResultNight() {
    console.log("Ergebnisse der Nacht:", choicesInTheNight);
    let deadPlayers = [];
    werewolfVictimCount = 1;
    choicesLastNight = {};

    for (const role in choicesInTheNight) {
        if (role === "Bäcker" || role === "Leibwächter" || role === "Dorfmatratze" || role === "HexeHeal" || role === "HexePoison") {
            choicesLastNight[role] = choicesInTheNight[role];
        }
    }

    console.log("choicesLastNight:", choicesLastNight);


    const getChoices = (role) => {
        const raw = choicesInTheNight[role];
        if (!raw) return [];

        const entries = Array.isArray(raw) ? raw : Object.values(raw);

        const pairs = entries.some(Array.isArray) ? entries : [entries];

        return pairs
            .map(pair => Array.isArray(pair) ? pair[0] : pair)
            .filter(choice => choice !== undefined && choice !== null);
    };

    const bodyguardChoices = new Set(getChoices("Leibwächter"));
    const witchChoicesPoison = new Set(getChoices("HexePoison"));
    const witchChoicesHeal = new Set(getChoices("HexeHeal"));
    const mattressPairs = Object.values(choicesInTheNight["Dorfmatratze"] || []).filter(pair => Array.isArray(pair) && pair.length >= 2);


    const killWithConnections = (start) => {
        const queue = [start];

        while (queue.length > 0) {
            const current = queue.shift();
            if (deadPlayers.includes(current)) continue;

            deadPlayers.push(current);

            lovers.forEach(([a, b]) => {
                if (a === current) queue.push(b);
                else if (b === current) queue.push(a);
            });

            mattressPairs.forEach(([chosen, slutNumber]) => {
                if (chosen === current) queue.push(slutNumber);
            });
        }
    };


    // Überprüfe ob Opfer der Werwölfe beschützt wurde von Leibwächter, wenn nein prüfe ob die Hexe den Heiltrank eingesetzt hat, wenn nein und das Opfer nicht die Rolle Dorfmatratze hat, dann stirbt das Opfer der Werwölfe
    if (choicesInTheNight["Werwolf"]) {
        Object.values(choicesInTheNight["Werwolf"]).forEach((victim) => {
            const victimPlayer = playerRoles.find(player => player.playerNumber === victim);
            if (
                !bodyguardChoices.has(victim) &&
                !witchChoicesHeal.has(victim) &&
                victimPlayer &&
                victimPlayer.role !== "Dorfmatratze"
            ) {
                killWithConnections(victim);
            }
        });
    }

    // Hat Hexe den Gifttrank eingesetzt, dann stirbt das Opfer der Hexe außer es wurde beschützt von Leibwächter, dann stirbt das Opfer der Hexe nicht
    if (choicesInTheNight["HexePoison"]) {
        witchChoicesPoison.forEach((poisonedPlayer) => {
            const poisonedPlayerObj = playerRoles.find(player => player.playerNumber === poisonedPlayer);

            if (poisonedPlayerObj && !bodyguardChoices.has(poisonedPlayer)) {
                killWithConnections(poisonedPlayer);
            }
        });
    }


    // Ist Wolfsjunge durch die Nacht gestorben, erhöhe Werwölfe Opfer für nächste Nacht um 1
    if (deadPlayers.some(playerNumber => {
        const player = playerRoles.find(p => p.playerNumber === playerNumber);
        return player && player.role === "Wolfsjunge";
    })) {
        werewolfVictimCount++;
    }


    // Keine Person kann öfters sterben, also keine Doppelungen in deadPlayers
    deadPlayers = [...new Set(deadPlayers)];

    return deadPlayers;
}





async function ShowResultBaker(bakerVictims) {
    task.textContent = `${bakerVictims.length > 1 ? `Die Opfer der Bäcker werden nun verraten.` : `Das Opfer des Bäckers wird nun verraten.`}`;
    await speech(`${bakerVictims.length > 1 ? `Die Opfer der Bäcker werden nun verraten.` : `Das Opfer des Bäckers wird nun verraten.`}`);

    for (const victim of bakerVictims) {
        const victimPlayer = playerRoles.find(player => player.playerNumber === victim);

        if (victimPlayer) {
            task.textContent = `${victimPlayer.player.charAt(0).toUpperCase() + victimPlayer.player.slice(1)} wurde vom Bäcker in dieser Nacht das Maul gestopft.`;
            await speech(`${victimPlayer.player.charAt(0).toUpperCase() + victimPlayer.player.slice(1)} wurde vom Bäcker in dieser Nacht das Maul gestopft.`);
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
}


async function StartVoting() {
    const alivePlayers = playerRoles.map(player => player.playerNumber);
    task.textContent = "Es ist Zeit für die Abstimmung.";
    await speech("Es ist Zeit für die Abstimmung. Bitte wählt einen Spieler, den ihr lynchen möchtet.");
    return showSelection("Es ist Zeit für die Abstimmung. Bitte wählt einen Spieler, den ihr lynchen möchtet.", 1, alivePlayers, true);
}


async function IsGameOver() {
    const alivePlayers = playerRoles.map(player => player.playerNumber);
    const aliveWerewolves = playerRoles.filter(player => player.role === "Werwolf" || player.role === "Wolfsjunge" || player.role === "Weißer Wolf").map(player => player.playerNumber);
    const aliveVillagers = alivePlayers.filter(playerNumber => !aliveWerewolves.includes(playerNumber));

    // Kein Spieler mehr am Leben
    if (alivePlayers.length === 0) {
        task.textContent = "Alle Spieler sind tot. Das Spiel ist vorbei.";
        await speech("Alle Spieler sind tot. Das Spiel ist vorbei.");
        return true;
    }

    // Alle Werwölfe sind tot
    if (aliveWerewolves.length === 0) {
        task.textContent = "Alle Werwölfe sind tot. Die Dorfbewohner haben gewonnen!";
        await speech("Alle Werwölfe sind tot. Die Dorfbewohner haben gewonnen!");
        return true;
    }

    // Nur noch weißer Wolf am Leben
    if (alivePlayers.length === 1 && aliveWerewolves.length === 1 && playerRoles.find(player => player.playerNumber === aliveWerewolves[0]).role === "Weißer Wolf") {
        task.textContent = "Nur noch der weiße Wolf ist am Leben. Der weiße Wolf hat gewonnen!";
        await speech("Nur noch der weiße Wolf ist am Leben. Der weiße Wolf hat gewonnen!");
        return true;
    }

    // Keine Dorfbewohner mehr am Leben
    if (aliveVillagers.length === 0) {
        task.textContent = "Alle Dorfbewohner sind tot. Die Werwölfe haben gewonnen!";
        await speech("Alle Dorfbewohner sind tot. Die Werwölfe haben gewonnen!");
        return true;
    }

    return false;
}


function GameOver() {
    const btn = document.createElement("button");
    btn.textContent = "Spiel beenden";
    btn.type = "button";
    btn.className = "selectionButton";

    btn.addEventListener("click", () => {
        window.location.href = "index.html";
    });

    document.getElementById("selectionButtons").appendChild(btn);
}


async function speech(text) {
    try {
        console.log("Spreche:", text);

        const result = await textToSpeech.call(
            text,
            "de",
            voiceStyle,
            8,
            1.0,
            0.2
        );

        const wavLength = Math.floor(
            textToSpeech.sampleRate * result.duration[0]
        );

        const wav = result.wav.slice(0, wavLength);

        const wavBuffer = writeWavFile(
            wav,
            textToSpeech.sampleRate
        );

        const blob = new Blob(
            [wavBuffer],
            { type: "audio/wav" }
        );

        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        await new Promise((resolve, reject) => {
            audio.addEventListener("ended", resolve, { once: true });
            audio.addEventListener("error", reject, { once: true });

            audio.play().catch(reject);
        });

        URL.revokeObjectURL(url);

    } catch (error) {
        console.error("TTS FEHLER:", error);
    }
}
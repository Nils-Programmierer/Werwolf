let playerRoles = [];
let choicesInTheNight = {};
let choicesLastNight = {};
let lovers = [];
let potionWitch = [];
let werewolfVictimCount = 1;
let step = 0;
let round = 0;

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

    if (playerRolesJSON) {
        playerRoles = JSON.parse(playerRolesJSON);
    }

    if (!playerRoles || playerRoles.length === 0) {
        console.error("No player roles found in localStorage.");
        window.location.href = "index.html";
        return;
    }

    console.log("Loaded playerRoles:", playerRoles);
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
    choicesLastNight = {
        ["Leibwächter"]: [null, playerRoles.find(player => player.role === "Leibwächter")?.playerNumber || null],
        ["Bäcker"]: [null, playerRoles.find(player => player.role === "Bäcker")?.playerNumber || null],
        ["Dorfmatratze"]: [null, playerRoles.find(player => player.role === "Dorfmatratze")?.playerNumber || null],
    };
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

    // TODO: Amor (Liebespaar), Seher, Hexe, Leibwächter, Bäcker, Dorfmatratze kann es öfters geben

    // Amor
    if (step === 1 && round === 1 && playerRoles.some(player => player.role === "Amor")) {
        task.textContent = "Der Amor wacht auf.";
        await speech("Als erstes wacht der Amor auf. Bitte wähle zwei Spieler, die ein Liebespaar werden sollen.");
        const [numberOfLovers, numberOfLovers2] = await showSelection("Wer soll das Liebespaar werden?", 2, playerRoles.filter(player => player.role !== "Amor").map(player => player.playerNumber));
        lovers.push(numberOfLovers, numberOfLovers2);
        choicesInTheNight["Amor"] = [playerRoles.find(player => player.role === "Amor").playerNumber, numberOfLovers, numberOfLovers2];

        task.textContent = "Bitte schließe nun die Augen und schlafe wieder ein.";
        await speech("Bitte schließe nun die Augen und schlafe wieder ein.");
    }


    // Liebespaar
    if (step === 2 && round === 1 && playerRoles.some(player => player.role === "Amor")) {
        const lover1 = playerRoles.find(player => player.playerNumber === lovers[0]).player;
        const lover2 = playerRoles.find(player => player.playerNumber === lovers[1]).player;

        task.textContent = lover1.charAt(0).toUpperCase() + lover1.slice(1) + " und " + lover2.charAt(0).toUpperCase() + lover2.slice(1) + " dürfen sich ineinander verlieben.";

        await speech(`Der Amor hat seine Wahl getroffen. Die beiden Spieler sind nun ein Liebespaar. Spieler ${lovers[0]} und Spieler ${lovers[1]} dürfen aufwachen und sich ineinander verlieben.`);
        await new Promise(resolve => setTimeout(resolve, 5000));

        task.textContent = "Bitte schließt nun die Augen und schlaft wieder ein.";
        await speech("Das Liebespaar hat sich nun unsterblich ineinander verliebt. Es darf nun wieder schlafen gehen.");
    }


    // Werwölfe
    if (step === 3 && playerRoles.some(player => player.role === "Werwolf")) {
        task.textContent = "Die Werwölfe wachen auf.";
        await speech(`Die Werwölfe wachen auf. Bitte wählt gemeinsam ${werewolfVictimCount == 1 ? "ein" : werewolfVictimCount} Opfer, ${werewolfVictimCount == 1 ? "das" : "die"} in dieser Nacht sterben ${werewolfVictimCount == 1 ? "soll" : "sollen"}.`);

        const possibleVictims = playerRoles.filter(player => player.role !== "Werwolf" && player.role !== "Wolfsjunge" && player.role !== "Weißer Wolf").map(player => player.playerNumber);
        console.log("Mögliche Opfer:", possibleVictims);
        const victim = await showSelection(`Die Werwölfe dürfen ${werewolfVictimCount == 1 ? "ein" : werewolfVictimCount} Opfer wählen.`, werewolfVictimCount, possibleVictims);
        choicesInTheNight["Werwolf"] = victim;

        task.textContent = "Bitte schließt nun die Augen und schlaft wieder ein.";
        await speech(`Die Werwölfe haben ${werewolfVictimCount == 1 ? "ein" : werewolfVictimCount} Opfer gewählt. Bitte schließt nun die Augen und schlaft wieder ein.`);
    }


    // Seher
    if (step === 4 && playerRoles.some(player => player.role === "Seher")) {
        task.textContent = "Der Seher wacht auf.";
        await speech("Der Seher wacht auf. Bitte wähle einen Spieler, dessen Rolle du erfahren möchtest.");

        const [seerChoice] = await showSelection("Wähle einen Spieler aus, dessen Rolle du erfahren möchtest.", 1, playerRoles.filter(player => player.role !== "Seher").map(player => player.playerNumber));
        choicesInTheNight["Seher"] = [seerChoice, playerRoles.find(player => player.role === "Seher").playerNumber];
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


    // Hexe
    if (step === 5 && playerRoles.some(player => player.role === "Hexe")) {
        task.textContent = "Die Hexe wacht auf.";
        await speech(`Die Hexe wacht auf. ${choicesInTheNight["Werwolf"].length > 1 ? "Die Opfer der Werwölfe werden dir nun verraten." : "Das Opfer der Werwölfe wird dir nun verraten."}`);

        if (choicesInTheNight["Werwolf"].length > 1) {
            task.textContent = "Opfer der Werwölfe: " + choicesInTheNight["Werwolf"].map(victim => playerRoles.find(player => player.playerNumber === victim).player.charAt(0).toUpperCase() + playerRoles.find(player => player.playerNumber === victim).player.slice(1)).join(", ");
        } else {
            task.textContent = "Opfer der Werwölfe: " + playerRoles.find(player => player.playerNumber === choicesInTheNight["Werwolf"][0]).player.charAt(0).toUpperCase() + playerRoles.find(player => player.playerNumber === choicesInTheNight["Werwolf"][0]).player.slice(1);
        }
        await new Promise(resolve => setTimeout(resolve, 5000));

        const hasHealOnPlayer = potionWitch.some(
            ([potion, playerId]) => potion === "heal" && playerId === playerRoles.filter(player => player.role === "Hexe").map(player => player.playerNumber)[0]
        );

        if (!hasHealOnPlayer) {
            await speech(`Du darfst nun entscheiden, ob du deinen Heiltrank einsetzen möchtest, um ${choicesInTheNight["Werwolf"].length > 1 ? "ein" : "das"} Opfer zu retten.`);
            const [witchChoiceHeal] = await showTwoSelection("Möchtest du deinen Heiltrank einsetzen?", 1, ["Heiltrank", "Kein Heiltrank"]);

            if (witchChoiceHeal === "Heiltrank") {
                await speech("Du darfst nun entscheiden, welchen Spieler du mit deinem Heiltrank retten möchtest.");
                const [witchHealChoice] = await showSelection("Wähle einen Spieler, den du mit deinem Heiltrank retten möchtest.", 1, choicesInTheNight["Werwolf"]);
                choicesInTheNight["HexeHeal"] = [witchHealChoice, playerRoles.find(player => player.role === "Hexe").playerNumber];
                potionWitch.push(["heal", playerRoles.find(player => player.role === "Hexe").playerNumber]);

                task.textContent = "Du hast deinen Heiltrank eingesetzt.";
                await speech("Du hast deinen Heiltrank eingesetzt.");
            }
        }

        const hasPoisonOnPlayer = potionWitch.some(
            ([potion, playerId]) => potion === "poison" && playerId === playerRoles.filter(player => player.role === "Hexe").map(player => player.playerNumber)[0]
        );

        if (!hasPoisonOnPlayer) {
            await speech("Du darfst nun entscheiden, ob du deinen Gifttrank einsetzen möchtest, um einen Spieler zu töten.");
            const [witchChoicePoison] = await showTwoSelection("Möchtest du deinen Gifttrank einsetzen?", 1, ["Gifttrank", "Kein Gifttrank"]);

            if (witchChoicePoison === "Gifttrank") {
                await speech("Du darfst nun entscheiden, welchen Spieler du mit deinem Gifttrank töten möchtest.");
                const [witchPoisonChoice] = await showSelection("Wähle einen Spieler, den du mit deinem Gifttrank töten möchtest.", 1, playerRoles.filter(player => player.role !== "Hexe").map(player => player.playerNumber));
                choicesInTheNight["HexePoison"] = [witchPoisonChoice, playerRoles.find(player => player.role === "Hexe").playerNumber];
                potionWitch.push(["poison", playerRoles.find(player => player.role === "Hexe").playerNumber]);

                task.textContent = "Du hast deinen Gifttrank eingesetzt.";
                await speech("Du hast deinen Gifttrank eingesetzt.");
            }
        }

        task.textContent = "Bitte schließe nun die Augen und schlafe wieder ein.";
        await speech("Bitte schließe nun die Augen und schlafe wieder ein.");
    }


    // Leibwächter
    if (step === 6 && playerRoles.some(player => player.role === "Leibwächter")) {
        task.textContent = "Der Leibwächter wacht auf.";
        await speech("Der Leibwächter wacht auf. Bitte wähle einen Spieler, den du schützen möchtest.");

        const [bodyguardChoice] = await showSelection("Wähle einen Spieler aus, den du schützen möchtest.", 1, playerRoles.map(player => player.playerNumber === choicesLastNight["Leibwächter"][0] || player.playerNumber === choicesLastNight["Leibwächter"][1] ? player.playerNumber : player.playerNumber));
        choicesInTheNight["Leibwächter"] = [bodyguardChoice, playerRoles.find(player => player.role === "Leibwächter").playerNumber];

        task.textContent = "Bitte schließe nun die Augen und schlafe wieder ein.";
        await speech("Bitte schließe nun die Augen und schlafe wieder ein.");
    }


    // Bäcker
    if (step === 7 && playerRoles.some(player => player.role === "Bäcker")) {
        task.textContent = "Der Bäcker wacht auf.";
        await speech("Der Bäcker wacht auf. Bitte wähle einen Spieler, den du in dieser Nacht das Maul stopfen möchtest.");

        const [bakerChoice] = await showSelection("Wähle einen Spieler aus, den du das Maul stopfen möchtest.", 1, playerRoles.map(player => choicesLastNight["Bäcker"][1] === player.playerNumber ? null : player.playerNumber === choicesLastNight["Bäcker"][0] ? null : player.playerNumber).filter(playerNumber => playerNumber !== null));
        choicesInTheNight["Bäcker"] = [bakerChoice, playerRoles.find(player => player.role === "Bäcker").playerNumber];

        task.textContent = "Bitte schließe nun die Augen und schlafe wieder ein.";
        await speech("Bitte schließe nun die Augen und schlafe wieder ein.");
    }


    // Dorfmatratze
    if (step === 8 && playerRoles.some(player => player.role === "Dorfmatratze")) {
        task.textContent = "Die Dorfmatratze wacht auf.";
        await speech("Die Dorfmatratze wacht auf. Bitte wähle einen Spieler, bei dem du in dieser Nacht schlafen möchtest.");

        const [villageSlutChoice] = await showSelection("Wähle einen Spieler aus, bei dem du schlafen möchtest.", 1, playerRoles.map(player => choicesLastNight["Dorfmatratze"][1] === player.playerNumber ? null : player.playerNumber === choicesLastNight["Dorfmatratze"][0] ? null : player.playerNumber).filter(playerNumber => playerNumber !== null));
        choicesInTheNight["Dorfmatratze"] = [villageSlutChoice, playerRoles.find(player => player.role === "Dorfmatratze").playerNumber];

        task.textContent = "Bitte schließe nun die Augen und schlafe wieder ein.";
        await speech("Bitte schließe nun die Augen und schlafe wieder ein.");
    }



    // Falls noch jemand aufzuwecken ist, dann wird die nächste Rolle aufgeweckt
    if (step < 8) {
        await WakeUpAtNight();
    } else {
        task.textContent = "Die Nacht ist vorbei. Alle Spieler wachen auf.";
        await speech("Die Nacht ist vorbei. Alle Spieler wachen auf.");
        await MakeDay();
    }
}


function showSelection(promptText, numberOfSelections, playerNumbers) {
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
    ShowResultNight(deadPlayers); //TODO: Falls Magd noch lebt, noch nicht die Rollen verraten, sondern erst wenn die Magd ablehnt, dann die Rollen verraten

    //TODO: Ist ein Jäger gestorben, dann darf der Jäger noch einen Spieler erschießen, bevor er stirbt

    if (IsGameOver()) {
        // Spiel ist vorbei
        GameOver();
        return;
    }


    //TODO: Ist Bürgermeister gestorben, dann Amt weitergeben



    //TODO: Falls Bürgermeister vorkommt
    if (round === 1) {
        // Bürgermeisterwahl
    } else {
        // Abstimmung
        StartVoting();
    }
}


function MakeResultNight() {
    console.log("Ergebnisse der Nacht:", choicesInTheNight);
    let deadPlayers = [];
    werewolfVictimCount = 1;
    choicesLastNight = {};

    for (const role in choicesInTheNight) {
        if (role === "Bäcker" || role === "Leibwächter" || role === "Dorfmatratze" || role === "Hexe") {
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
    const witchChoicesHeal = new Set(getChoices("HexeHeal"));
    const mattressChoices = getChoices("Dorfmatratze");


    // Überprüfe ob Opfer der Werwölfe beschützt wurde von Leibwächter, wenn nein prüfe ob die Hexe den Heiltrank eingesetzt hat, wenn nein und das Opfer nicht die Rolle Dorfmatratze hat, dann stirbt das Opfer der Werwölfe
    if (choicesInTheNight["Werwolf"]) {
        Object.values(choicesInTheNight["Werwolf"]).forEach((victim) => {
            const victimPlayer = playerRoles.find(player => player.playerNumber === victim);
            if (!bodyguardChoices.has(victim) && !witchChoicesHeal.has(victim) && victimPlayer && victimPlayer.role !== "Dorfmatratze") {
                deadPlayers.push(victim);

                // Hat zusätzlich noch Dorfmatratze dort geschlafen oder/und Opfer ist Liebespaar stirbt eine/sterben weitere Person/en
                if (lovers.includes(victim)) {
                    const loverIndex = lovers.indexOf(victim);
                    const lover = lovers[loverIndex === 0 ? 1 : 0];
                    deadPlayers.push(lover);
                }

                for (let i = 0; i < mattressChoices.length - 1; i += 2) {
                    if (mattressChoices[i] === victim) {
                        deadPlayers.push(mattressChoices[i + 1]);
                    }
                }
            }
        });
    }

    // Hat Hexe den Gifttrank eingesetzt, dann stirbt das Opfer der Hexe außer es wurde beschützt von Leibwächter, dann stirbt das Opfer der Hexe nicht
    if (choicesInTheNight["HexePoison"]) {
        const poisonChoices = choicesInTheNight["HexePoison"];

        if (Array.isArray(poisonChoices[0])) {
            poisonChoices.forEach((choice) => {
                const playerId = choice[0];

                if (playerId !== undefined && !bodyguardChoices.has(playerId)) {
                    deadPlayers.push(playerId);
                }
            });
        } else {
            const playerId = poisonChoices[0];

            if (playerId !== undefined && !bodyguardChoices.has(playerId)) {
                deadPlayers.push(playerId);
            }
        }
    }



    // Ist Wolfsjunge durch die Nacht gestorben, erhöhe Werwölfe Opfer für nächste Nacht um 1
    if (deadPlayers.some(playerNumber => {
        const player = playerRoles.find(p => p.playerNumber === playerNumber);
        return player && player.role === "Wolfsjunge";
    })) {
        werewolfVictimCount++;
    }

    return deadPlayers;
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
let playerRoles = [];
let step = 0;
let round = 0;

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
    StartNight();
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

        await speech("Willkommen zum Spiel Werwolf. Bitte wähle deine Rolle aus.");

    } catch (error) {
        console.error("Fehler beim Starten:", error);
    }
}

initGame();



function StartNight() {
    round++;
    step = 0;
    WakeUpAtNight();
}


function WakeUpAtNight() {
    step++;


    // TODO: Amor (Liebespaar), Seher, Hexe, Leibwächter, Bäcker, Dorfmatratze kann es öfters geben
    if (step === 1 && round === 1 && playerRoles.some(player => player.role === "Amor")) {
        // Amor
    }


    if (step === 2 && round === 1 && playerRoles.some(player => player.role === "Amor")) {
        // Liebespaar
    }


    if (step === 3 && playerRoles.some(player => player.role === "Werwolf")) {
        // Werwölfe
    }


    if (step === 4 && playerRoles.some(player => player.role === "Seher")) {
        // Seher
    }


    if (step === 5 && playerRoles.some(player => player.role === "Hexe")) {
        // Hexe
    }


    if (step === 6 && playerRoles.some(player => player.role === "Leibwächter")) {
        // Leibwächter
    }


    if (step === 7 && playerRoles.some(player => player.role === "Bäcker")) {
        // Bäcker
    }


    if (step === 8 && playerRoles.some(player => player.role === "Dorfmatratze")) {
        // Dorfmatratze
    }



    // Falls noch jemand aufzuwecken ist, dann wird die nächste Rolle aufgeweckt
    if (step < 8) {
        WakeUpAtNight();
    } else {
        //MakeDay();
    }
}



function MakeDay() {
    const deadPlayers = MakeResultNight();
    ShowResultNight(deadPlayers);


    if (IsGameOver()) {
        // Spiel ist vorbei
        GameOver();
        return;
    }


    //TODO: Falls Bürgermeister vorkommt
    if (round === 1) {
        // Bürgermeisterwahl
    } else {
        // Abstimmung
        StartVoting();
    }
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

        audio.addEventListener("ended", () => {
            URL.revokeObjectURL(url);
        }, { once: true });

        await audio.play();

    } catch (error) {
        console.error("TTS FEHLER:", error);
    }
}


window.speech = speech;
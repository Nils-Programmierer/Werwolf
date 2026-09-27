let playerRoles = [];
let step = 0;
let round = 0;


function LoadData() {
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


LoadData();



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
        MakeDay();
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
# Werwolf
Werwolf - Spiele deine Rolle. Täusche alle.



<a href="img/icon512_rounded.png"><img src="img/icon512_rounded.png" alt="Werwolf Logo" width="200" /></a>

## Beschreibung
Werwolf ist ein spannendes Partyspiel voller Täuschung, Diskussionen und überraschender Wendungen. Schlüpfe in deine Rolle, finde heraus, wem du vertrauen kannst, und entlarve die Werwölfe, bevor es zu spät ist.


## Funktionen
- Mehr als 10 verschiedene Rollen mit einzigartigen Fähigkeiten und Strategien
- Unterstützung für mehr als 40 Spieler gleichzeitig
- Komplett ohne Erzähler: die Web-App übernimmt die gesamte Spielleitung
- Eine intuitive und übersichtliche Benutzeroberfläche für ein einfaches und zugängliches Spielerlebnis


## Einblicke

<a href=""><img src="" alt="" height="300" /></a>
<a href=""><img src="" alt="" height="300" /></a>
<a href=""><img src="" alt="Hauptseite" height="300" /></a>
<a href=""><img src="" alt="Mobile Ansicht" height="300" /></a>
<a href=""><img src="" alt="Demo Video" height="300" /></a>

## Projektstatus

**Letztes Update:** September 2026

## Technologien

In diesem Projekt kommen folgende Technologien und Tools zum Einsatz:

### Frontend:

<p>
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/html5/html5-original.svg" alt="HTML5" height="40" />
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/css3/css3-original.svg" alt="CSS3" height="40" />
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/javascript/javascript-original.svg" alt="JavaScript" height="40" />
</p>

### Text-to-Speech

Für die automatische Sprachausgabe verwendet das Projekt **Supertonic-3** von Supertone Inc.

Die ONNX-Modelle und Konfigurationsdateien werden bei Bedarf direkt von Hugging Face geladen (`Supertone/supertonic-3`, Verzeichnis `onnx`). `helper.js` speichert diese Antworten zusätzlich in der Cache API des Browsers unter `werwolf-tts-v1`, damit sie bei späteren Aufrufen möglichst aus dem lokalen Cache geladen werden können. Das Stimmprofil `M1.json` wird ebenfalls von Hugging Face geladen; es wird im Anwendungscode nicht in diesem Cache abgelegt.

Die TTS-Inferenz und Erzeugung der Audiodaten erfolgen im Browser. Der dafür vorgesehene Text wird nicht an eine TTS-API übermittelt. ONNX Runtime Web wird als JavaScript-Modul von **unpkg.com** geladen. Wenn der Browser WebGPU unterstützt, wird WebGPU verwendet; andernfalls greift ONNX Runtime Web auf WebAssembly (WASM) zurück.

Verwendete Komponenten:

- **Supertonic-3** – Text-to-Speech-Modell von Supertone Inc.
- **ONNX Runtime Web** – Ausführung der ONNX-Modelle im Browser
- **WebGPU** – Hardwarebeschleunigte TTS-Inferenz, sofern verfügbar
- **Hugging Face** – Bereitstellung der Modell- und Stimmprofildateien
- **unpkg** – Bereitstellung des ONNX-Runtime-Web-Moduls
- **WebAssembly (WASM)** – Fallback für nicht unterstützte Browser

Das Supertonic-3-Modell und die zugehörigen Modellressourcen unterliegen der [BigScience Open RAIL-M License](https://huggingface.co/Supertone/supertonic-3/blob/main/LICENSE).


## Benutzung

**Projekt klonen**

Klone dieses Repository auf deinen lokalen Rechner:

```bash
git clone https://github.com/Nils-Programmierer/Werwolf.git
```

**Website**

Nutze die Web-App direkt über die folgende URL:

[https://nils-programmierer.github.io/Werwolf/](https://nils-programmierer.github.io/Werwolf/)


## Beitragende

- [Nils-Programmierer](https://github.com/Nils-Programmierer)  (Entwickler und Projektleiter)


## Lizenz und Drittanbieterrechte

### Eigener Projektcode

Der eigene Quellcode dieses Projekts ist urheberrechtlich geschützt. Sofern nicht ausdrücklich anders angegeben, gilt dafür die im Repository enthaltene Datei [LICENSE](LICENSE): Alle Rechte vorbehalten. Das öffentliche Einsehen des GitHub-Repositories erteilt keine allgemeine Erlaubnis, den Projektcode zu vervielfältigen, zu verändern oder weiterzuverbreiten.

Diese Rechteangabe gilt nicht für Drittanbieter-Komponenten und Dateien, die eigenen Lizenzbedingungen unterliegen. Die folgenden Hinweise erfassen jeweils nur die genannte Komponente und stellen sie nicht unter die Projekt-Lizenz.

### Supertonic-3-Modell

Die Anwendung lädt die ONNX-Modellgewichte, Konfigurationsdateien und das Stimmprofil `M1.json` zur Laufzeit aus dem [Supertonic-3-Repository von Supertone Inc. auf Hugging Face](https://huggingface.co/Supertone/supertonic-3). Diese Modellressourcen unterliegen der [OpenRAIL-M-Lizenz](https://huggingface.co/Supertone/supertonic-3/blob/main/LICENSE). Bei ihrer Nutzung und Weitergabe sind die Lizenzbedingungen einschließlich der Nutzungsbeschränkungen in Anhang A zu beachten. Die Modellressourcen werden nicht im Repository mitgeliefert.

Das Supertonic-Projekt nennt für seinen Beispielcode die MIT-Lizenz und für das begleitende Modell die OpenRAIL-M-Lizenz. Die MIT-Angabe für den Beispielcode lizenziert weder die Modellgewichte noch den eigenständigen Werwolf-Projektcode. Weitere Einzelheiten stehen in den Lizenzangaben des [Modellprojekts](https://huggingface.co/Supertone/supertonic-3) und des [zugehörigen Quellcode-Repositories](https://github.com/supertone-inc/supertonic).

### Bibliotheken und Schriftart

- [ONNX Runtime Web](https://github.com/microsoft/onnxruntime) wird als Modul von unpkg.com geladen und steht unter der MIT-Lizenz. Maßgeblich sind die Lizenz- und Copyright-Hinweise der jeweils ausgelieferten Paketversion.
- Die Schriftart Montserrat in `fonts/Montserrat/` unterliegt der SIL Open Font License 1.1; siehe [fonts/Montserrat/OFL.txt](fonts/Montserrat/OFL.txt).

Weitere zur Laufzeit geladene oder gebündelte Drittanbieter-Komponenten können eigenen Lizenzbedingungen unterliegen. Es gelten die jeweiligen mitgelieferten Lizenz- und Copyright-Hinweise.

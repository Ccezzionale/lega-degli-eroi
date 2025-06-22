const URL_CLASSIFICA_TOTALE = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTduESMbJiPuCDLaAFdOHjep9GW-notjraILSyyjo6SA0xKSR0H0fgMLPNNYSwXgnGGJUyv14kjFRqv/pub?gid=691152130&single=true&output=csv";

const coloriSquadre = {
  "RAFA CASABLANCA": "#005f3f",
  "UNION LIBRINO": "#c299ff",
  "GIODY": "#0a0a1a",
  "GIULAY": "#66ccff",
  "RUBIN KEBAB": "#e60000",
  "TEAM BARTOWSKI": "#990000",
  "BAYENR CHRISTANSEN": "#990000",
  "IBLA": "#aaffaa",
  "MINNESODE TIMBERLAND": "#ff9933",
  "POERMANTRA": "#4b0082",
  "WILDBOYS": "#faff00",
  "REAL MIMMO": "#ffaa00"
};

function creaHTMLSquadra(nome, posizione = "", punteggio = "") {
  const nomePulito = nome.replace(/[°]/g, "").trim().toUpperCase();
  const colore = coloriSquadre[nomePulito] || "#ddd";  // fallback

  return `
    <div class="team" style="background-color: ${colore}; text-transform: uppercase;">
      <img src="img/${formattaNomePerLogo(nome)}.png" alt="${nome}" onerror="this.style.display='none'">
      <div class="team-name">${nomePulito} ${posizione ? `(${posizione})` : ""}</div>
      <div class="score">${punteggio ?? ""}</div>
    </div>`;
}


function aggiornaPlayoff() {
  const posizioni = [
    [5, 10], [6, 9], [7, 8], [4, 11],
    [7, 8], [6, 9], [5, 10], [4, 11]
  ];

  const mappingWC = ["WC1", "WC2", "WC3", "WC4"];
  const mappingPosWC = [
    [7, 8], [4, 11], [5, 10], [6, 9]
  ];

  const matchDivs = document.querySelectorAll(".match");

  matchDivs.forEach((match, idx) => {
    const container = match;

    // 🔹 Wildcard
    if (idx < 4) {
      const [i1, i2] = mappingPosWC[idx];
      const matchId = mappingWC[idx];
      const risultato = window.risultati?.find(r => r.partita === matchId);

      const squadraA = risultato?.squadraA || squadre[i1]?.nome || "?";
      const squadraB = risultato?.squadraB || squadre[i2]?.nome || "?";
      const posizioneA = `${squadre.findIndex(s => s.nome === squadraA) + 1}°` || `${i1 + 1}°`;
      const posizioneB = `${squadre.findIndex(s => s.nome === squadraB) + 1}°` || `${i2 + 1}°`;
      const punteggioA = risultato?.golA ?? "";
      const punteggioB = risultato?.golB ?? "";

      container.innerHTML = `
        ${creaHTMLSquadra(squadraA, posizioneA, punteggioA)}
        <div class="separator"></div>
        ${creaHTMLSquadra(squadraB, posizioneB, punteggioB)}
      `;
    }

    // 🔸 Quarti
    else if (idx >= 4 && idx <= 7) {
      const ordineTesteDiSerie = [0, 3, 2, 1];
      const testaSerieIndex = idx - 4;
      const teamTop4Index = ordineTesteDiSerie[testaSerieIndex];

      const mapping = [
        [4, 2], [7, 3], [6, 0], [5, 1]
      ];
      const [idxPosA, idxPosB] = mapping[testaSerieIndex];
      const squadraBIndex1 = posizioni[idxPosB][0];
      const squadraBIndex2 = posizioni[idxPosB][1];

      const nomeB_fallback = `Vincente ${squadraBIndex1 + 1}°/${squadraBIndex2 + 1}°`;

      const matchId = `Q${testaSerieIndex + 1}`;
      const risultato = window.risultati?.find(r => r.partita === matchId);

      const squadraA = risultato?.squadraA || squadre[teamTop4Index]?.nome || "?";
      const squadraB = risultato?.squadraB || nomeB_fallback;

      const posizioneA = `${squadre.findIndex(s => s.nome === squadraA) + 1}°`;
      const posizioneB = squadre.find(s => s.nome === squadraB)
        ? `${squadre.findIndex(s => s.nome === squadraB) + 1}°`
        : "";

      const punteggioA = risultato?.golA ?? "";
      const punteggioB = risultato?.golB ?? "";

      container.innerHTML = `
        ${creaHTMLSquadra(squadraA, posizioneA, punteggioA)}
        <div class="separator"></div>
        ${creaHTMLSquadra(squadraB, posizioneB, punteggioB)}
      `;
    }

    // ⚔️ Semifinali
    else if (idx === 8 || idx === 9) {
      const semiIndex = idx - 8;
      const mapping = [
        ["Q1", "Q2"],
        ["Q3", "Q4"]
      ];
      const [id1, id2] = mapping[semiIndex];

      const risultato1 = window.risultati?.find(r => r.partita === id1);
      const risultato2 = window.risultati?.find(r => r.partita === id2);
      const risultatoSemi = window.risultati?.find(r => r.partita === `S${semiIndex + 1}`);

      const squadraA = risultato1?.vincente || `Vincente ${id1}`;
      const squadraB = risultato2?.vincente || `Vincente ${id2}`;

      const posizioneA = squadre.findIndex(s => s.nome === squadraA) !== -1
        ? `${squadre.findIndex(s => s.nome === squadraA) + 1}°` : "";

      const posizioneB = squadre.findIndex(s => s.nome === squadraB) !== -1
        ? `${squadre.findIndex(s => s.nome === squadraB) + 1}°` : "";

      const punteggioA = risultatoSemi?.golA ?? "";
      const punteggioB = risultatoSemi?.golB ?? "";

      container.innerHTML = `
        ${creaHTMLSquadra(squadraA, posizioneA, punteggioA)}
        <div class="separator"></div>
        ${creaHTMLSquadra(squadraB, posizioneB, punteggioB)}
      `;
    }

    // 🏆 Finale
    else if (idx === 10) {
      const risultato1 = window.risultati?.find(r => r.partita === "S1");
      const risultato2 = window.risultati?.find(r => r.partita === "S2");
      const risultatoFinale = window.risultati?.find(r => r.partita === "F");

      const squadraA = risultato1?.vincente || `Vincente ${risultato1?.squadraA || "S1A"} / ${risultato1?.squadraB || "S1B"}`;
      const squadraB = risultato2?.vincente || `Vincente ${risultato2?.squadraA || "S2A"} / ${risultato2?.squadraB || "S2B"}`;

      const posizioneA = squadre.findIndex(s => s.nome === squadraA) !== -1
        ? `${squadre.findIndex(s => s.nome === squadraA) + 1}°` : "";

      const posizioneB = squadre.findIndex(s => s.nome === squadraB) !== -1
        ? `${squadre.findIndex(s => s.nome === squadraB) + 1}°` : "";

      const punteggioA = risultatoFinale?.golA ?? "";
      const punteggioB = risultatoFinale?.golB ?? "";

      container.innerHTML = `
        ${creaHTMLSquadra(squadraA, posizioneA, punteggioA)}
        <div class="separator"></div>
        ${creaHTMLSquadra(squadraB, posizioneB, punteggioB)}
      `;
    }
  });
}

// 🟢 Caricamento classifica
fetch(URL_CLASSIFICA_TOTALE)
  .then(res => res.text())
  .then(csv => {
    const righe = csv.trim().split("\n");
    const squadreProvvisorie = [];

    for (let i = 1; i < righe.length; i++) {
      const colonne = righe[i].split(",").map(c => c.replace(/"/g, "").trim());
      const nome = colonne[1];
      const punti = parseInt(colonne[10]) || 0;
      const mp = parseFloat(colonne[11].replace(",", ".")) || 0;
      if (!nome || isNaN(punti)) continue;
      squadreProvvisorie.push({ nome, punti, mp });
      if (squadreProvvisorie.length === 12) break;
    }

    squadreProvvisorie.sort((a, b) => {
      if (b.punti !== a.punti) return b.punti - a.punti;
      return b.mp - a.mp;
    });

    window.squadre = squadreProvvisorie;
  })
  .catch(err => console.error("❌ Errore nel caricamento classifica Totale:", err));

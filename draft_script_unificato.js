
const tabella = document.querySelector("#tabella-pick tbody");
const listaGiocatori = document.getElementById("lista-giocatori");
const giocatoriScelti = new Set();
const filtroRuolo = document.getElementById("filtroRuolo");
const filtroSerieA = document.getElementById("filtroSerieA");
const searchInput = document.getElementById("searchGiocatore");
const cercaRuolo = document.getElementById("cercaRuolo");

const mappaGiocatori = {};
let ruoli = new Set();
let squadre = new Set();

function normalize(nome) {
  return nome.trim().toLowerCase();
}

function inviaPickAlFoglio(pick, fantaTeam, nome, ruolo, squadra, quotazione) {
  const dati = new URLSearchParams();
  dati.append("pick", pick);
  dati.append("squadra", squadra);
  dati.append("fantaTeam", fantaTeam);
  dati.append("giocatore", nome);
  dati.append("ruolo", ruolo);
  dati.append("quotazione", quotazione);

  fetch("https://script.google.com/macros/s/AKfycbxFamdCRhlGfZ3j53yPUlGzE3dlrpxHvsJbXGht2D4fHJJ1HDybWoWg5Doin2d0BccF8Q/exec", {
    method: "POST",
    body: dati
  })
  .then(res => res.text())
  .then(txt => console.log("Risposta foglio:", txt))
  .catch(err => console.error("Errore invio pick:", err));
}

function caricaGiocatori() {
  return fetch("giocatori_completo_finale.csv")
    .then(res => res.text())
    .then(csv => {
      const righe = csv.trim().split(/\r?\n/).slice(1);
      righe.forEach(r => {
        const [nome, ruolo, squadra, quotazione] = r.split(",");
        const key = normalize(nome);
        mappaGiocatori[key] = { nome, ruolo, squadra, quotazione };
        if (ruolo) ruoli.add(ruolo);
        if (squadra) squadre.add(squadra);
      });
    });
}

function caricaPick() {
  return fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vTDKKMarxp0Kl7kiIWa-1X7jB-54KcQaLIGArN1FfR_X40rwAKVRgUYRGhrzIJ7SsKtUPnk_Cz8F0qt/pub?output=csv")
    .then(res => res.text())
    .then(csv => {
      const righe = csv.trim().split(/\r?\n/).slice(1);
      let prossima = null;
      righe.forEach(r => {
        const [pick, fantaTeam, nomeGrezzo, ruolo, squadra] = r.split(",");
        const nome = nomeGrezzo ? nomeGrezzo.trim() : "";
        const key = normalize(nome);
        const tr = document.createElement("tr");
        giocatoriScelti.add(key);
        tr.innerHTML = `
          <td>${pick}</td>
          <td>${fantaTeam}</td>
          <td>${nome}</td>
          <td>${ruolo}</td>
          `;
        if (!nome && !prossima) {
          prossima = { fantaTeam, pick };
          tr.classList.add("next-pick");
        } else {
          tr.style.backgroundColor = "#d4edda";
          tr.style.fontWeight = "bold";
        }
        tabella.appendChild(tr);
      });
      document.getElementById("turno-attuale").textContent =
        prossima
          ? `🎯 È il turno di: ${prossima.fantaTeam} (Pick ${prossima.pick})`
          : "✅ Draft completato!";
    });
}

function popolaListaDisponibili() {
  listaGiocatori.innerHTML = "";
  Object.values(mappaGiocatori).forEach(({ nome, ruolo, squadra, quotazione }) => {
    const key = normalize(nome);
    if (giocatoriScelti.has(key)) return;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${nome}</td>
      <td>${ruolo}</td>
      <td>${squadra}</td>
      <td>${parseInt(quotazione)}</td>`;
    tr.addEventListener("click", () => {
      const conferma = confirm(`Vuoi selezionare ${nome} per la squadra al turno?`);
      if (conferma) {
        const righe = document.querySelectorAll("#tabella-pick tbody tr");
        for (let r of righe) {
          const celle = r.querySelectorAll("td");
          if (!celle[2].textContent.trim()) {
            const pick = celle[0].textContent;
            const fantaTeam = celle[1].textContent;
            celle[2].textContent = nome;
            celle[3].textContent = ruolo;
            celle[4].textContent = squadra;
            r.style.backgroundColor = "#d4edda";
            r.style.fontWeight = "bold";
            r.classList.remove("next-pick");
            document.getElementById("turno-attuale").textContent = `✅ ${nome} selezionato!`;
            inviaPickAlFoglio(pick, fantaTeam, nome, ruolo, squadra, quotazione);
            break;
          }
        }
        tr.remove();
      }
    });
    listaGiocatori.appendChild(tr);
  });

  Array.from(ruoli).forEach(r => {
    const opt = document.createElement("option");
    opt.value = r;
    opt.textContent = r;
    filtroRuolo.appendChild(opt);
  });

  Array.from(squadre).sort((a, b) => a.localeCompare(b)).forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    filtroSerieA.appendChild(opt);
  });
}

function filtraLista() {
  const ruoloTesto = cercaRuolo.value.toLowerCase();
  const ruoloSelect = filtroRuolo.value.toLowerCase().split(/[,;\s]+/).filter(Boolean);
  const squadra = filtroSerieA.value.toLowerCase();
  const cerca = searchInput.value.toLowerCase();

  Array.from(listaGiocatori.children).forEach(row => {
    const nome = row.children[0].textContent.toLowerCase();
    const r = row.children[1].textContent.toLowerCase();
    const s = row.children[2].textContent.toLowerCase();
    const ruoliGiocatore = r.split(/[,;\s]+/).map(part => part.trim());

    const matchInput = !ruoloTesto || ruoliGiocatore.some(part => part.includes(ruoloTesto));
    const matchSelect = !ruoloSelect.length || ruoloSelect.some(rs => ruoliGiocatore.includes(rs));
    const matchSquadra = !squadra || s === squadra;
    const matchNome = !cerca || nome.includes(cerca);

    row.style.display = (matchInput && matchSelect && matchSquadra && matchNome) ? "" : "none";
  });
}

[filtroRuolo, filtroSerieA, searchInput, cercaRuolo].forEach(el => {
  if (el) el.addEventListener("input", filtraLista);
});

window.addEventListener("DOMContentLoaded", function () {
  caricaGiocatori().then(() =>
    caricaPick().then(() => {
      popolaListaDisponibili();
      aggiornaChiamatePerSquadra();
    })
  );
});

function aggiornaChiamatePerSquadra() {
  const righe = document.querySelectorAll("#tabella-pick tbody tr");
  const riepilogo = {};
  righe.forEach(r => {
    const celle = r.querySelectorAll("td");
    const team = celle[1]?.textContent?.trim();
    const nome = celle[2]?.textContent?.trim();
    const ruolo = celle[3]?.textContent?.trim();
    if (!team || !nome) return;
    if (!riepilogo[team]) riepilogo[team] = [];
    riepilogo[team].push(`${riepilogo[team].length + 1}. ${nome} (${ruolo})`);
  });

  const container = document.getElementById("riepilogo-squadre");
  container.innerHTML = "";

  for (const [team, picks] of Object.entries(riepilogo)) {
    const div = document.createElement("div");
    div.className = "riepilogo-team";
    const logoPath = `img/${team}.png`;
    const img = document.createElement("img");
    img.src = logoPath;
    img.alt = team;
    img.style.maxWidth = "60px";
    img.style.margin = "0 auto 8px";
    img.style.display = "block";
    div.appendChild(img);

    const h4 = document.createElement("h4");
    h4.textContent = team;
    h4.style.textAlign = "center";
    h4.style.color = "#ffffff";
    div.appendChild(h4);

    picks.forEach(txt => {
      const riga = document.createElement("div");
      riga.textContent = txt;
      riga.style.textAlign = "center";
      riga.style.color = "#ffffff";
      div.appendChild(riga);
    });

    container.appendChild(div);
  }
}
window.aggiornaChiamatePerSquadra = aggiornaChiamatePerSquadra;

let ordineAscendente = {};

function ordinaPick(colonnaIndex, numerico = false) {
  const tbody = document.querySelector("#tabella-pick tbody");
  const righe = Array.from(tbody.querySelectorAll("tr"));

  const asc = !ordineAscendente[colonnaIndex];
  ordineAscendente[colonnaIndex] = asc;

  document.querySelectorAll("#tabella-pick thead th").forEach((th, idx) => {
    th.textContent = th.textContent.replace(/[\u2191\u2193]/g, "");
    if (idx === colonnaIndex) {
      th.textContent += asc ? " \u2191" : " \u2193";
    }
  });

  righe.sort((a, b) => {
    const aText = a.children[colonnaIndex]?.textContent.trim();
    const bText = b.children[colonnaIndex]?.textContent.trim();

    if (numerico) {
      const aNum = parseFloat(aText) || 0;
      const bNum = parseFloat(bText) || 0;
      return asc ? aNum - bNum : bNum - aNum;
    } else {
      return asc ? aText.localeCompare(bText) : bText.localeCompare(aText);
    }
  });

  tbody.innerHTML = "";
  righe.forEach(r => tbody.appendChild(r));
}
window.ordinaPick = ordinaPick;

let ordineListaAscendente = {};

function ordinaLista(colonnaIndex, numerico = false) {
  const tbody = document.getElementById("lista-giocatori");
  const righe = Array.from(tbody.querySelectorAll("tr"));

  const asc = !ordineListaAscendente[colonnaIndex];
  ordineListaAscendente[colonnaIndex] = asc;

  document.querySelectorAll("#lista-giocatori-table thead th").forEach((th, idx) => {
    th.textContent = th.textContent.replace(/[\u2191\u2193]/g, "");
    if (idx === colonnaIndex) {
      th.textContent += asc ? " \u2191" : " \u2193";
    }
  });

  righe.sort((a, b) => {
    const aText = a.children[colonnaIndex]?.textContent.trim();
    const bText = b.children[colonnaIndex]?.textContent.trim();

    if (numerico) {
      const aNum = parseFloat(aText) || 0;
      const bNum = parseFloat(bText) || 0;
      return asc ? aNum - bNum : bNum - aNum;
    } else {
      return asc ? aText.localeCompare(bText) : bText.localeCompare(aText);
    }
  });

  tbody.innerHTML = "";
  righe.forEach(r => tbody.appendChild(r));
}
window.ordinaLista = ordinaLista;

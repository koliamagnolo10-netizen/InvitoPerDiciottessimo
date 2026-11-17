const SUPABASE_URL = "https://ghimmpnbpkthrtoaeqgv.supabase.co";
const SUPABASE_KEY = "sb_publishable_5Pvoxb6a0WtDPgc84Cq36w_T4PYEGww";
const dbSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const DATA_SCADENZA = new Date(2027, 5, 10, 23, 59, 59);

document.addEventListener("DOMContentLoaded", () => {
  const statusBadge = document.getElementById("connection-status");
  const form = document.getElementById("add-guest-form");
  const tbody = document.getElementById("guests-tbody");
  const totalCountEl = document.getElementById("total-count");
  const btnToggleStats = document.getElementById("btn-toggle-stats");
  const statsDrawer = document.getElementById("stats-drawer");
  const toastEl = document.getElementById("toast");

  btnToggleStats.addEventListener("click", () => {
    statsDrawer.classList.toggle("hidden");
  });

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), 2500);
  }

  function buildInviteLink(id) {
    const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf("/") + 1);
    return `${baseUrl}index.html?id=${id}`;
  }

  // ==========================================================
  // INCOLLA QUI LA FUNZIONE loadGuests() AGGIORNATA
  // ==========================================================
  async function loadGuests() {
    const { data, error } = await dbSupabase
      .from("invitati")
      .select("*")
      .order("categoria", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      statusBadge.innerHTML = `<span class="status-dot error"></span> Errore connessione`;
      tbody.innerHTML = `<tr><td colspan="5" class="empty-row">Errore nel caricamento: ${error.message}</td></tr>`;
      return;
    }

    statusBadge.innerHTML = `<span class="status-dot connected"></span> Connesso a Supabase`;
    totalCountEl.textContent = `${data.length} Invitati`;

    let siCount = 0;
    let noCount = 0;
    let attesaCount = 0;
    let adultiTot = 0;
    let adultiSi = 0;
    let ragazziTot = 0;
    let ragazziSi = 0;

    const isExpired = new Date() > DATA_SCADENZA;

    data.forEach((g) => {
      const fascia = g["adulto/ragazzo"] || "Non spec.";
      if (fascia === "Adulto") {
        adultiTot++;
        if (g.risposta === "SI") adultiSi++;
      } else if (fascia === "Ragazzo") {
        ragazziTot++;
        if (g.risposta === "SI") ragazziSi++;
      }

      if (g.risposta === "SI") siCount++;
      else if (g.risposta === "NO") noCount++;
      else attesaCount++;
    });

    document.getElementById("stat-si").textContent = siCount;
    document.getElementById("stat-no").textContent = noCount;
    document.getElementById("stat-attesa").textContent = attesaCount;
    document.getElementById("stat-adulti").textContent = `${adultiTot} / ${adultiSi}`;
    document.getElementById("stat-ragazzi").textContent = `${ragazziTot} / ${ragazziSi}`;

    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-row">Nessun invitato inserito nel database</td></tr>`;
      return;
    }

    const grouped = {};
    data.forEach((guest) => {
      const cat = guest.categoria || "Altro";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(guest);
    });

    tbody.innerHTML = "";

    Object.keys(grouped).forEach((categoria) => {
      const groupRow = document.createElement("tr");
      groupRow.className = "category-group-row";
      groupRow.innerHTML = `
        <td colspan="5">📁 ${categoria} <span class="cat-subcount">(${grouped[categoria].length})</span></td>
      `;
      tbody.appendChild(groupRow);

      grouped[categoria].forEach((guest) => {
        const tr = document.createElement("tr");

        let statoHtml = `<span class="badge-status pending">In attesa ⏳</span>`;
        if (guest.risposta === "SI") {
          statoHtml = `<span class="badge-status accepted">Ci sarà 🥂</span>`;
        } else if (guest.risposta === "NO") {
          statoHtml = `<span class="badge-status declined">Non ci sarà ❌</span>`;
        } else if (isExpired) {
          statoHtml = `<span class="badge-status expired">Scaduto ⛔</span>`;
        }

        const etaLabel = guest["adulto/ragazzo"] || "—";

        tr.innerHTML = `
          <td class="td-name">${guest.nome} ${guest.cognome}</td>
          <td><span class="badge-cat">${guest.categoria}</span></td>
          <td><span class="badge-age">${etaLabel}</span></td>
          <td>${statoHtml}</td>
          <td class="td-actions">
            <button class="btn-copy" data-id="${guest.id}">Copia Link 🔗</button>
            <button class="btn-delete" data-id="${guest.id}" data-name="${guest.nome} ${guest.cognome}">Elimina 🗑️</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    });

    document.querySelectorAll(".btn-copy").forEach((btn) => {
      btn.addEventListener("click", () => {
        const link = buildInviteLink(btn.dataset.id);
        navigator.clipboard.writeText(link).then(() => {
          showToast("Link invito copiato! Pronto da incollare su WhatsApp.");
        });
      });
    });

    document.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const name = btn.dataset.name;
        if (!id) return;
        if (!confirm(`Vuoi davvero eliminare ${name || "questo invitato"} dalla lista?`)) return;

        const { error: delError } = await dbSupabase
          .from("invitati")
          .delete()
          .eq("id", id);

        if (!delError) {
          showToast(`${name} eliminato.`);
          loadGuests();
        } else {
          alert("Errore durante l'eliminazione: " + delError.message);
        }
      });
    });
  }
  // ==========================================================

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = document.getElementById("input-nome").value.trim();
    const cognome = document.getElementById("input-cognome").value.trim();
    const categoria = document.getElementById("select-categoria").value;
    const eta = document.querySelector('input[name="eta"]:checked').value;

    if (!nome || !cognome) return;

    const btnSubmit = document.getElementById("btn-submit");
    btnSubmit.disabled = true;

    const { error } = await dbSupabase.from("invitati").insert([
      {
        nome: nome,
        cognome: cognome,
        categoria: categoria,
        "adulto/ragazzo": eta,
        risposta: "IN_ATTESA"
      }
    ]);

    btnSubmit.disabled = false;

    if (error) {
      alert("Errore salvataggio su Supabase: " + error.message);
      return;
    }

    form.reset();
    document.getElementById("eta-ragazzo").checked = true;
    showToast(`Invito creato per ${nome} ${cognome}!`);
    loadGuests();
  });

  loadGuests();
});
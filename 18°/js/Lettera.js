const SUPABASE_URL = "https://ghimmpnbpkthrtoaeqgv.supabase.co";
const SUPABASE_KEY = "sb_publishable_5Pvoxb6a0WtDPgc84Cq36w_T4PYEGww";
const dbSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Data limite per confermare (Anno, Mese - 1, Giorno, Ora, Minuto) -> 10 Giugno 2026 alle 23:59
const DATA_SCADENZA = new Date(2026, 5, 10, 23, 59, 59);

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const guestId = params.get("id");

  const guestNameEl = document.getElementById("guest-name");
  const eventDetailsEl = document.getElementById("event-details");
  const blurHintEl = document.getElementById("blur-hint");
  const rsvpSectionEl = document.getElementById("rsvp-section");
  const feedbackEl = document.getElementById("status-feedback");
  const deadlineBannerEl = document.getElementById("deadline-banner");
  const btnYes = document.getElementById("btn-yes");
  const btnNo = document.getElementById("btn-no");

  if (!guestId) {
    guestNameEl.textContent = "Invito non valido";
    rsvpSectionEl.classList.add("hidden");
    deadlineBannerEl.innerHTML = "⚠️ Link privo di codice invitato. Usa il link personale ricevuto.";
    return;
  }

  // Carica i dati dell'invitato da Supabase
  const { data: guest, error } = await dbSupabase
    .from("invitati")
    .select("*")
    .eq("id", guestId)
    .single();

  if (error || !guest) {
    guestNameEl.textContent = "Invito non trovato";
    rsvpSectionEl.classList.add("hidden");
    deadlineBannerEl.innerHTML = "⚠️ Questo invito non esiste o è stato rimosso.";
    return;
  }

  guestNameEl.textContent = `${guest.nome} ${guest.cognome}`;

  const now = new Date();
  const isExpired = now > DATA_SCADENZA;

  // Funzione helper per far scomparire un elemento con dissolvenza
  function fadeOutAndHide(el, instant = false) {
    if (!el || el.classList.contains("hidden")) return;
    if (instant) {
      el.classList.add("hidden");
      return;
    }
    el.classList.add("fade-collapse");
    setTimeout(() => {
      el.classList.add("hidden");
    }, 500);
  }

  // Funzioni di aggiornamento UI
  function showAcceptedState(instant = false) {
    eventDetailsEl.classList.remove("blurred");
    fadeOutAndHide(blurHintEl, instant);
    fadeOutAndHide(rsvpSectionEl, instant);
    fadeOutAndHide(deadlineBannerEl, instant);

    feedbackEl.className = "status-feedback success";
    feedbackEl.textContent = "Evviva! Presenza confermata con successo! 🥂";
    feedbackEl.classList.remove("hidden");
  }

  function showDeclinedState(instant = false) {
    eventDetailsEl.classList.add("blurred");
    fadeOutAndHide(rsvpSectionEl, instant);
    fadeOutAndHide(deadlineBannerEl, instant);

    feedbackEl.className = "status-feedback declined";
    feedbackEl.textContent = "Risposta registrata. Ci dispiace che tu non ci sia! 😔";
    feedbackEl.classList.remove("hidden");
  }

  function showExpiredState() {
    eventDetailsEl.classList.add("blurred");
    rsvpSectionEl.classList.add("hidden");
    deadlineBannerEl.classList.add("expired");
    deadlineBannerEl.innerHTML = "⛔ Il tempo per rispondere è scaduto. L'invito è considerato nullo.";
  }

  // Verifica stato attuale dal DB al caricamento pagina
  if (guest.risposta === "SI") {
    showAcceptedState(true);
  } else if (guest.risposta === "NO") {
    showDeclinedState(true);
  } else if (isExpired) {
    showExpiredState();
  }

  // Gestione click "SÌ, CI SARÒ!"
  btnYes.addEventListener("click", async () => {
    if (new Date() > DATA_SCADENZA) {
      showExpiredState();
      return;
    }
    btnYes.disabled = true;
    btnNo.disabled = true;

    const { error: updateError } = await dbSupabase
      .from("invitati")
      .update({ risposta: "SI" })
      .eq("id", guestId);

    if (!updateError) {
      showAcceptedState(false);
    } else {
      btnYes.disabled = false;
      btnNo.disabled = false;
      alert("Errore nel salvataggio della risposta. Riprova.");
    }
  });

  // Gestione click "NO, NON POSSO"
  btnNo.addEventListener("click", async () => {
    if (new Date() > DATA_SCADENZA) {
      showExpiredState();
      return;
    }
    btnYes.disabled = true;
    btnNo.disabled = true;

    const { error: updateError } = await dbSupabase
      .from("invitati")
      .update({ risposta: "NO" })
      .eq("id", guestId);

    if (!updateError) {
      showDeclinedState(false);
    } else {
      btnYes.disabled = false;
      btnNo.disabled = false;
      alert("Errore nel salvataggio della risposta. Riprova.");
    }
  });
});
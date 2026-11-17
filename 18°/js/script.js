document.addEventListener("DOMContentLoaded", () => {
  const sealBtn = document.getElementById("open-seal");
  const envelope = document.getElementById("envelope");
  const canvas = document.getElementById("confetti-canvas");
  const ctx = canvas.getContext("2d");

  let particles = [];
  let animationRunning = false;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  function launchGoldConfetti() {
    const colors = ["#d4af37", "#f3d982", "#aa8220", "#ffffff", "#ffd700"];
    particles = [];
    for (let i = 0; i < 140; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 11 + 4;
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        gravity: 0.25,
        drag: 0.96,
        alpha: 1
      });
    }
    if (!animationRunning) {
      animationRunning = true;
      animateConfetti();
    }
  }

  function animateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, idx) => {
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.alpha -= 0.012;

      if (p.alpha <= 0) {
        particles.splice(idx, 1);
        return;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });

    if (particles.length > 0) {
      requestAnimationFrame(animateConfetti);
    } else {
      animationRunning = false;
    }
  }

  sealBtn.addEventListener("click", () => {
    if (envelope.classList.contains("opened")) return;

    // 1. Esplosione coriandoli dorati
    launchGoldConfetti();

    // 2. Apertura lembo busta ed estrazione biglietto
    envelope.classList.add("opened");

    // 3. Passaggio alla pagina Lettera mantenendo il parametro ?id=...
    const params = new URLSearchParams(window.location.search);
    const guestId = params.get("id");
    const targetUrl = guestId
      ? `Lettera.html?id=${encodeURIComponent(guestId)}`
      : "Lettera.html";

    setTimeout(() => {
      document.body.classList.add("fade-out");
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 450);
    }, 1450);
  });
});
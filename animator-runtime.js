/**
 * Animator Runtime V4.0 (ALL EFFECTS INCLUDED)
 * https://github.com/jeeinog/editor-assets-webai/blob/main/animator-runtime.js
 */
(function () {
  window.MagicAnimator = class MagicAnimator {
    constructor() {
      this.init();
    }

    init() {
      document
        .querySelectorAll("[data-anim-config]")
        .forEach((el) => this.setup(el));
    }

    setup(el) {
      try {
        const configStr = el.getAttribute("data-anim-config");
        if (!configStr) return;
        const config = JSON.parse(configStr);

        // LIMPIEZA AGRESIVA
        const oldCanvas = el.parentNode.querySelector(`.anim-canvas-layer`);
        if (oldCanvas && el.tagName === "IMG") oldCanvas.remove();
        const innerCanvas = el.querySelector(
          ":scope > canvas.anim-canvas-layer"
        );
        if (innerCanvas) innerCanvas.remove();

        let canvas;

        if (el.tagName === "IMG") {
          let wrapper = el.parentElement;
          if (!wrapper.classList.contains("anim-wrapper")) {
            wrapper = document.createElement("div");
            wrapper.classList.add("anim-wrapper");
            wrapper.style.position = "relative";
            wrapper.style.display = "inline-block";
            wrapper.style.lineHeight = "0";
            wrapper.style.margin = el.style.margin;
            el.style.margin = "0";
            el.parentNode.insertBefore(wrapper, el);
            wrapper.appendChild(el);
          }
          canvas = this.createCanvas();
          wrapper.appendChild(canvas);
        } else {
          const style = window.getComputedStyle(el);
          if (style.position === "static") el.style.position = "relative";
          canvas = this.createCanvas();
          el.insertBefore(canvas, el.firstChild);
        }

        config.effect = (config.effect || "").toLowerCase();
        this.startLoop(canvas, config, el);

        new ResizeObserver(() => {
          canvas.width = el.clientWidth;
          canvas.height = el.clientHeight;
        }).observe(el);
      } catch (e) {
        console.error("Animator Error:", e);
      }
    }

    createCanvas() {
      const c = document.createElement("canvas");
      c.className = "anim-canvas-layer";
      c.style.position = "absolute";
      c.style.top = "0";
      c.style.left = "0";
      c.style.width = "100%";
      c.style.height = "100%";
      c.style.pointerEvents = "none";
      c.style.zIndex = "1";
      return c;
    }

    startLoop(canvas, config, el) {
      const ctx = canvas.getContext("2d");
      let particles = [];
      const count = config.intensity || 60;
      const speed = (config.speed || 50) / 10;
      this.baseHue = config.color || 180;

      for (let i = 0; i < count; i++)
        particles.push(this.createParticle(canvas, config.effect, speed));

      const animate = () => {
        if (!document.body.contains(canvas)) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach((p, index) => {
          this.updateParticle(p, canvas, speed);
          if (this.checkReset(p, canvas)) {
            particles[index] = this.createParticle(
              canvas,
              config.effect,
              speed
            );
          } else {
            this.drawParticle(ctx, p);
          }
        });
        requestAnimationFrame(animate);
      };
      animate();
    }

    // --- FÍSICA Y LÓGICA COMPLETA ---
    createParticle(canvas, effect, speed) {
      const w = canvas.width;
      const h = canvas.height;
      const getColor = (s, l) => `hsl(${this.baseHue}, ${s}%, ${l}%)`;

      let p = {
        life: 100,
        maxLife: 100,
        effect: effect,
        x: Math.random() * w,
        y: Math.random() * h,
      };

      switch (effect) {
        case "snow":
          p.y = -10;
          p.speedY = (Math.random() * 2 + 1) * speed;
          p.speedX = (Math.random() - 0.5) * speed;
          p.size = Math.random() * 5 + 2;
          p.color = "white";
          p.wobble = Math.random();
          break;
        case "rain":
          p.y = Math.random() * h;
          p.speedY = (Math.random() * 10 + 10) * speed;
          p.speedX = 0;
          p.size = Math.random() * 2 + 1;
          p.color = `hsla(210, 80%, 70%, 0.7)`;
          break;
        case "sparks":
        case "fireflies":
          p.speedX = (Math.random() - 0.5) * 5 * speed;
          p.speedY = (Math.random() - 0.5) * 5 * speed;
          p.size = Math.random() * 3 + 1;
          p.color = getColor(100, 60);
          break;
        case "bubbles":
          p.y = h + 10;
          p.speedY = -(Math.random() * 2 + 1) * speed;
          p.speedX = (Math.random() - 0.5) * speed;
          p.size = Math.random() * 10 + 5;
          p.color = `hsla(${this.baseHue}, 70%, 70%, 0.3)`;
          break;
        case "leaves": // NUEVO
          p.y = -10;
          p.speedY = (Math.random() * 2 + 1) * speed;
          p.speedX = (Math.random() - 0.5) * 2 * speed;
          p.size = Math.random() * 10 + 5;
          p.color = `hsl(${30 + Math.random() * 40}, 70%, 40%)`; // Otoño
          p.rotation = Math.random() * 360;
          break;
        case "hearts": // NUEVO
          p.y = h + 10;
          p.speedY = -(Math.random() * 3 + 1) * speed;
          p.speedX = (Math.random() - 0.5) * speed;
          p.size = Math.random() * 15 + 5;
          p.color = `hsla(${340 + Math.random() * 30}, 80%, 60%, 0.8)`;
          break;
        case "confetti": // NUEVO
          p.y = -10;
          p.speedY = (Math.random() * 4 + 2) * speed;
          p.speedX = (Math.random() - 0.5) * 4 * speed;
          p.size = Math.random() * 6 + 3;
          p.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
          p.rotation = Math.random() * 360;
          break;
        case "stars": // NUEVO
          p.speedX = 0;
          p.speedY = 0;
          p.size = Math.random() * 3;
          p.color = "white";
          p.life = Math.random() * 100; // Para parpadeo
          break;
        case "energy": // NUEVO
        case "magic":
          p.x = w / 2;
          p.y = h / 2; // Desde el centro
          const angle = Math.random() * Math.PI * 2;
          const vel = Math.random() * 5 * speed;
          p.speedX = Math.cos(angle) * vel;
          p.speedY = Math.sin(angle) * vel;
          p.size = Math.random() * 4 + 1;
          p.color = getColor(100, 70);
          break;
        case "smoke": // NUEVO
          p.y = h + 10;
          p.speedY = -(Math.random() * 1 + 0.5) * speed;
          p.speedX = (Math.random() - 0.5) * speed;
          p.size = Math.random() * 20 + 10;
          p.color = `hsla(0, 0%, 80%, 0.1)`;
          break;
        case "aurora": // NUEVO
        case "nebula":
          p.speedX = (Math.random() - 0.5) * 0.5 * speed;
          p.speedY = (Math.random() - 0.5) * 0.5 * speed;
          p.size = Math.random() * 50 + 20;
          p.color = `hsla(${
            this.baseHue + Math.random() * 50
          }, 70%, 50%, 0.05)`;
          break;
        case "glitter": // NUEVO
          p.speedX = 0;
          p.speedY = 0;
          p.size = Math.random() * 4;
          p.color = `hsl(50, 100%, 80%)`; // Dorado
          p.life = Math.random() * 100;
          break;

        default: // FALLBACK
          p.speedY = speed;
          p.size = 3;
          p.color = getColor(100, 50);
      }
      return p;
    }

    updateParticle(p, canvas, speed) {
      // Lógica de movimiento específica
      if (p.effect === "snow" || p.effect === "leaves") {
        p.x += Math.sin(p.wobble || 0) * 0.5;
        if (p.wobble) p.wobble += 0.05;
      }
      if (p.effect === "stars" || p.effect === "glitter") {
        p.life -= 1; // Solo parpadeo
        if (p.life < 0) p.life = 100; // Loop vida
        return;
      }

      p.x += p.speedX || 0;
      p.y += p.speedY || 0;
      if (p.rotation) p.rotation += 0.1;
      p.life -= 0.5;
    }

    checkReset(p, canvas) {
      if (p.effect === "stars" || p.effect === "glitter") return false; // No se mueven
      return (
        p.life <= 0 ||
        p.y > canvas.height + 50 ||
        p.x > canvas.width + 50 ||
        p.x < -50 ||
        p.y < -50
      );
    }

    drawParticle(ctx, p) {
      ctx.save();

      // Manejo de opacidad para estrellas/glitter
      if (p.effect === "stars" || p.effect === "glitter") {
        ctx.globalAlpha = Math.abs(Math.sin(p.life * 0.1));
      } else {
        ctx.globalAlpha = p.life / 100;
      }

      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      if (p.rotation) ctx.rotate(p.rotation);

      ctx.beginPath();
      if (p.effect === "rain") {
        ctx.rect(0, 0, 1, p.size * 5);
      } else if (p.effect === "leaves" || p.effect === "confetti") {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else if (p.effect === "hearts") {
        const s = p.size / 2;
        ctx.moveTo(0, 0);
        ctx.arc(-s, -s, s, Math.PI, 0);
        ctx.arc(s, -s, s, Math.PI, 0);
        ctx.lineTo(0, s * 2);
      } else {
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => new window.MagicAnimator()
    );
  } else {
    new window.MagicAnimator();
  }
})();

/**
 * Animator Runtime V3.0 (Fixed Cleaning & Logic)
 */
(function () {
  window.MagicAnimator = class MagicAnimator {
    constructor() {
      this.init();
    }

    init() {
      // Buscar elementos
      document
        .querySelectorAll("[data-anim-config]")
        .forEach((el) => this.setup(el));
    }

    setup(el) {
      try {
        const configStr = el.getAttribute("data-anim-config");
        if (!configStr) return;
        const config = JSON.parse(configStr);

        // --- CORRECCIÓN CRÍTICA DE LIMPIEZA ---
        // 1. Borrar cualquier canvas que esté dentro del elemento (Caso DIV/Fondo)
        const innerCanvas = el.querySelector(
          ":scope > canvas.anim-canvas-layer"
        );
        if (innerCanvas) innerCanvas.remove();

        // 2. Borrar cualquier canvas que esté en el wrapper (Caso IMG)
        if (el.parentNode && el.parentNode.classList.contains("anim-wrapper")) {
          const wrapperCanvas = el.parentNode.querySelector(
            "canvas.anim-canvas-layer"
          );
          if (wrapperCanvas) wrapperCanvas.remove();
        }
        // -------------------------------------

        let canvas;

        // CREACIÓN
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

        // Normalizar nombre del efecto (evita errores de mayúsculas)
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
      // Usamos una clase consistente para poder encontrarlo y borrarlo luego
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
      const count = config.intensity || 50;
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
        default:
          // Efecto visual por defecto si falla el nombre
          p.speedY = speed;
          p.size = 3;
          p.color = getColor(100, 50);
      }
      return p;
    }

    updateParticle(p, canvas, speed) {
      if (p.effect === "snow") p.x += Math.sin(p.wobble) * 0.5;
      p.x += p.speedX || 0;
      p.y += p.speedY || 0;
      p.life -= 0.5;
    }

    checkReset(p, canvas) {
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
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / 100;
      ctx.beginPath();
      if (p.effect === "rain") ctx.rect(p.x, p.y, 1, p.size * 5);
      else ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
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

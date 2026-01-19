/**
 * Animator Runtime v1.0
 * Este script lee configuraciones JSON de imágenes y renderiza efectos en canvas.
 */
(function () {
  class MagicAnimator {
    constructor() {
      this.baseHue = 180;
      this.init();
    }

    init() {
      // Busca imágenes con configuración
      const images = document.querySelectorAll("img[data-anim-config]");
      images.forEach((img) => this.setup(img));
    }

    setup(img) {
      try {
        const config = JSON.parse(img.getAttribute("data-anim-config"));
        if (!config || !config.effect) return;

        // Crear wrapper para superponer el canvas
        const wrapper = document.createElement("div");
        wrapper.style.position = "relative";
        wrapper.style.display = "inline-block";
        wrapper.style.lineHeight = "0";
        wrapper.className = img.className; // Heredar clases para layout

        // Insertar wrapper y mover imagen dentro
        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(img);

        // Crear Canvas
        const canvas = document.createElement("canvas");
        canvas.style.position = "absolute";
        canvas.style.top = "0";
        canvas.style.left = "0";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.pointerEvents = "none"; // Click atraviesa
        canvas.style.zIndex = "5";

        wrapper.appendChild(canvas);

        // Iniciar animación
        this.startLoop(canvas, config, img);

        // Monitor de tamaño
        new ResizeObserver(() => {
          canvas.width = img.clientWidth;
          canvas.height = img.clientHeight;
        }).observe(img);
      } catch (e) {
        console.error("Error iniciando animación:", e);
      }
    }

    startLoop(canvas, config, img) {
      const ctx = canvas.getContext("2d");
      let particles = [];
      const count = config.intensity || 50;
      const speed = (config.speed || 50) / 10;
      const hue = config.color || 180;
      this.baseHue = hue;

      // Llenar inicial
      for (let i = 0; i < count; i++)
        particles.push(this.createParticle(canvas, config.effect, speed));

      const animate = () => {
        // Verificar si el elemento sigue en el DOM
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

    // --- FÍSICA Y LÓGICA (La misma que el editor) ---
    createParticle(canvas, effect, speed) {
      const w = canvas.width;
      const h = canvas.height;
      const getColor = (hOff = 0, s = 100, l = 50) =>
        `hsl(${(this.baseHue + hOff) % 360}, ${s}%, ${l}%)`;
      let p = {
        life: 100,
        maxLife: 100,
        effect: effect,
        x: Math.random() * w,
        y: Math.random() * h,
      };

      switch (effect) {
        case "sparks":
          p.size = Math.random() * 3 + 2;
          p.speedX = (Math.random() - 0.5) * 4 * speed;
          p.speedY = (Math.random() - 0.5) * 4 * speed;
          p.color = getColor(Math.random() * 60, 100, 70);
          break;
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
          p.speedY = (Math.random() * 8 + 4) * speed;
          p.speedX = 0;
          p.size = Math.random() * 2 + 1;
          p.color = `hsla(210, 80%, 70%, 0.7)`;
          break;
        case "leaves":
          p.y = -20;
          p.size = Math.random() * 15 + 10;
          p.speedY = Math.random() * 1 + 0.5 * speed;
          p.speedX = (Math.random() - 0.5) * 1.5 * speed;
          p.rotation = Math.random() * 6;
          p.color = getColor(30 + Math.random() * 60, 70, 40);
          break;
        // ... Agrega aquí el resto de efectos (hearts, bubbles, etc) copiando del editor ...
        // Para el ejemplo, pongo un default robusto:
        default:
          p.speedX = (Math.random() - 0.5) * 3 * speed;
          p.speedY = (Math.random() - 0.5) * 3 * speed;
          p.size = Math.random() * 4 + 2;
          p.color = getColor(0, 100, 60);
      }
      return p;
    }

    updateParticle(p, canvas, speed) {
      if (p.effect === "snow") {
        p.x += Math.sin(p.wobble) * 0.5;
        p.wobble += 0.05;
      }
      p.x += p.speedX || 0;
      p.y += p.speedY || 0;
      p.life -= 0.5;
      if (p.rotation) p.rotation += 0.05;
    }

    checkReset(p, canvas) {
      return (
        p.life <= 0 ||
        p.y > canvas.height + 50 ||
        p.x > canvas.width + 50 ||
        p.x < -50
      );
    }

    drawParticle(ctx, p) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.translate(p.x, p.y);
      if (p.rotation) ctx.rotate(p.rotation);

      ctx.beginPath();
      if (p.effect === "rain") {
        ctx.rect(0, 0, p.size / 2, p.size * 5);
      } else {
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();
    }
  }

  // Auto-arranque
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => new MagicAnimator());
  } else {
    new MagicAnimator();
  }
})();

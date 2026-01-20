/**
 * Animator Runtime v1.1
 * Soporta IMG y Contenedores con Background-Image
 */
(function () {
  class MagicAnimator {
    constructor() {
      this.baseHue = 180;
      this.init();
    }

    init() {
      // MODIFICACIÓN 1: Buscar cualquier elemento con la config, no solo img
      const elements = document.querySelectorAll("[data-anim-config]");
      elements.forEach((el) => this.setup(el));
    }

    setup(el) {
      try {
        const configStr = el.getAttribute("data-anim-config");
        if (!configStr) return;
        
        const config = JSON.parse(configStr);
        if (!config || !config.effect) return;

        // Limpiar canvas previos si hubo recarga
        const oldCanvas = el.parentNode.querySelector(`.anim-canvas-${config.effect}`);
        if (oldCanvas && el.tagName === 'IMG') oldCanvas.remove();
        if (el.querySelector('canvas.anim-canvas')) el.querySelector('canvas.anim-canvas').remove();

        let canvas;

        // MODIFICACIÓN 2: Lógica diferente para IMG vs Contenedores (DIV/SECTION)
        if (el.tagName === "IMG") {
            // Caso IMG: Necesitamos un wrapper
            // Verificamos si ya tiene wrapper para no anidar infinitamente
            let wrapper = el.parentElement;
            if (!wrapper.classList.contains('anim-wrapper')) {
                wrapper = document.createElement("div");
                wrapper.classList.add('anim-wrapper');
                wrapper.style.position = "relative";
                wrapper.style.display = "inline-block";
                wrapper.style.lineHeight = "0";
                
                // Clonar estilos críticos
                wrapper.style.margin = el.style.margin;
                el.style.margin = "0";
                
                el.parentNode.insertBefore(wrapper, el);
                wrapper.appendChild(el);
            }

            canvas = document.createElement("canvas");
            canvas.style.position = "absolute";
            canvas.style.top = "0";
            canvas.style.left = "0";
            canvas.style.width = "100%";
            canvas.style.height = "100%";
            canvas.style.pointerEvents = "none";
            canvas.style.zIndex = "5";
            wrapper.appendChild(canvas);

        } else {
            // Caso Fondo (DIV, SECTION, ETC): El canvas va ADENTRO
            // Aseguramos posición relativa para que el canvas absoluto se ubique bien
            const computedStyle = window.getComputedStyle(el);
            if (computedStyle.position === 'static') {
                el.style.position = 'relative';
            }

            canvas = document.createElement("canvas");
            canvas.classList.add('anim-canvas');
            canvas.style.position = "absolute";
            canvas.style.top = "0";
            canvas.style.left = "0";
            canvas.style.width = "100%";
            canvas.style.height = "100%";
            canvas.style.pointerEvents = "none";
            canvas.style.zIndex = "1"; // Justo encima del fondo
            
            // Insertar al principio para no tapar el contenido del div
            el.insertBefore(canvas, el.firstChild);
        }

        // Iniciar animación
        this.startLoop(canvas, config, el);

        // Monitor de tamaño
        new ResizeObserver(() => {
          canvas.width = el.clientWidth;
          canvas.height = el.clientHeight;
        }).observe(el);

      } catch (e) {
        console.error("Error iniciando animación:", e);
      }
    }

    startLoop(canvas, config, el) {
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

    // --- FÍSICA Y LÓGICA ---
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
        case "hearts":
            p.y = h + 20;
            p.size = Math.random() * 12 + 8;
            p.speedY = -(Math.random() * 2 + 1) * speed;
            p.speedX = (Math.random() - 0.5) * 1.5 * speed;
            p.color = getColor(330 + Math.random() * 30, 80, 60);
            break;
        case "bubbles":
            p.y = h + 10;
            p.size = Math.random() * 15 + 5;
            p.speedY = -(Math.random() * 1.5 + 0.5) * speed;
            p.speedX = (Math.random() - 0.5) * 0.5 * speed;
            p.color = `hsla(${(this.baseHue + Math.random() * 40) % 360}, 60%, 80%, 0.4)`;
            break;
        case "stars":
            p.speedX = (Math.random() - 0.5) * 0.1;
            p.speedY = (Math.random() - 0.5) * 0.1;
            p.size = Math.random() * 2 + 1;
            p.color = `hsla(60, 80%, 80%, ${Math.random()})`;
            break;
        case "fireflies":
            p.speedX = (Math.random() - 0.5) * 0.5 * speed;
            p.speedY = (Math.random() - 0.5) * 0.5 * speed;
            p.size = Math.random() * 3 + 2;
            p.color = getColor(60, 100, 60);
            break;
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
        p.x < -50 ||
        p.y < -50 
      );
    }

    drawParticle(ctx, p) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / 100; // Normalizar vida a opacidad
      ctx.translate(p.x, p.y);
      if (p.rotation) ctx.rotate(p.rotation);

      ctx.beginPath();
      if (p.effect === "rain") {
        ctx.rect(0, 0, p.size / 2, p.size * 5);
      } else if(p.effect === "hearts") {
         // Dibujo simple corazón
         const s = p.size;
         ctx.moveTo(0,0);
         ctx.arc(-s/4, -s/4, s/4, Math.PI, 0);
         ctx.arc(s/4, -s/4, s/4, Math.PI, 0);
         ctx.lineTo(0, s/2);
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

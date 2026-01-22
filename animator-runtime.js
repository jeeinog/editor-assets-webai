/**
 * Animator Runtime V5.0 (ALL EFFECTS INCLUDED)
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

        // 1. Limpieza (Igual que antes)
        const oldCanvas = el.parentNode.querySelector(`.anim-canvas-layer`);
        if (oldCanvas && el.tagName === "IMG") oldCanvas.remove();
        const innerCanvas = el.querySelector(
          ":scope > canvas.anim-canvas-layer"
        );
        if (innerCanvas) innerCanvas.remove();

        if (el.parentNode && el.parentNode.classList.contains("anim-wrapper")) {
          const wrapperCanvas = el.parentNode.querySelector(
            "canvas.anim-canvas-layer"
          );
          if (wrapperCanvas) wrapperCanvas.remove();
        }

        let canvas;

        // 2. Creación (Igual que antes)
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
      const count = parseInt(config.intensity) || 80;
      // IMPORTANTE: Normalizamos la velocidad igual que en el editor
      const speed = (parseInt(config.speed) || 50) / 10;
      this.baseHue = parseInt(config.color) || 180;

      // Crear partículas iniciales
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

    // --- FÍSICA PORTADA EXACTAMENTE DEL EDITOR ---
    createParticle(canvas, effect, speed) {
      const di = {
        drawWidth: canvas.width,
        drawHeight: canvas.height,
        offsetX: 0,
        offsetY: 0,
      };
      const cx = di.drawWidth / 2;
      const cy = di.drawHeight / 2;
      const w = canvas.width;
      const h = canvas.height;

      const getColor = (hOff = 0, s = 100, l = 50) =>
        `hsl(${(this.baseHue + hOff) % 360}, ${s}%, ${l}%)`;

      let p = { life: 100, maxLife: 100, effect: effect };

      switch (effect) {
        case "sparks":
          p.x = cx + (Math.random() - 0.5) * di.drawWidth * 0.8;
          p.y = cy + (Math.random() - 0.5) * di.drawHeight * 0.8;
          p.size = Math.random() * 3 + 2;
          p.speedX = (Math.random() - 0.5) * 4 * speed;
          p.speedY = (Math.random() - 0.5) * 4 * speed;
          p.color = getColor(Math.random() * 60, 100, 60 + Math.random() * 30);
          p.trail = [];
          break;

        case "snow":
          p.x = Math.random() * w;
          p.y = -10;
          p.size = Math.random() * 6 + 3;
          p.speedX = (Math.random() - 0.5) * 0.5 * speed;
          p.speedY = Math.random() * 1.5 + 0.5 * speed;
          p.speedZ = Math.random() * 0.5 + 0.5;
          p.rotation = Math.random() * Math.PI * 2;
          p.rotationSpeed = (Math.random() - 0.5) * 0.02;
          p.color = `hsla(200, 30%, ${90 + Math.random() * 10}%, ${
            0.7 + Math.random() * 0.3
          })`;
          p.wobble = Math.random() * 0.5;
          break;

        case "rain":
          p.x = Math.random() * w;
          p.y = Math.random() * h; // Lluvia empieza en cualquier lado para llenar pantalla
          p.size = Math.random() * 4 + 2;
          p.length = Math.random() * 10 + 15;
          p.speedX = (Math.random() - 0.5) * 0.2;
          p.speedY = Math.random() * 8 + 4 * speed; // Fórmula exacta del editor
          p.color = `hsla(210, 80%, ${70 + Math.random() * 20}%, ${
            0.7 + Math.random() * 0.3
          })`;
          p.splash = 0;
          break;

        case "leaves":
          p.x = Math.random() * w;
          p.y = -20;
          p.size = Math.random() * 15 + 10;
          p.speedX = (Math.random() - 0.5) * 1.5 * speed;
          p.speedY = Math.random() * 1 + 0.5 * speed;
          p.rotation = Math.random() * Math.PI * 2;
          p.rotationSpeed = (Math.random() - 0.5) * 0.03;
          p.color = getColor(
            30 + Math.random() * 60,
            70,
            40 + Math.random() * 30
          );
          p.wobble = Math.random() * 0.1;
          p.wobbleSpeed = Math.random() * 0.05 + 0.02;
          break;

        case "hearts":
          p.x = cx + (Math.random() - 0.5) * di.drawWidth * 0.6;
          p.y = h + 20;
          p.size = Math.random() * 12 + 8;
          p.speedX = (Math.random() - 0.5) * 1.5 * speed;
          p.speedY = -(Math.random() * 2 + 1) * speed;
          p.rotation = Math.random() * Math.PI * 2;
          p.rotationSpeed = (Math.random() - 0.5) * 0.02;
          p.color = getColor(
            330 + Math.random() * 30,
            80,
            60 + Math.random() * 20
          );
          p.pulse = Math.random() * Math.PI * 2;
          break;

        case "confetti":
          p.x = cx + (Math.random() - 0.5) * di.drawWidth;
          p.y = -20;
          p.size = Math.random() * 8 + 4;
          p.speedX = (Math.random() - 0.5) * 3 * speed;
          p.speedY = Math.random() * 3 + 1 * speed;
          p.rotation = Math.random() * Math.PI * 2;
          p.rotationSpeed = (Math.random() - 0.5) * 0.1;
          p.color = getColor(Math.random() * 360, 100, 60 + Math.random() * 30);
          p.shape = Math.floor(Math.random() * 3);
          break;

        case "bubbles":
          p.x = cx + (Math.random() - 0.5) * di.drawWidth * 0.8;
          p.y = h + 10;
          p.size = Math.random() * 15 + 5;
          p.speedX = (Math.random() - 0.5) * 0.5 * speed;
          p.speedY = -(Math.random() * 1.5 + 0.5) * speed;
          p.color = `hsla(${
            (this.baseHue + Math.random() * 40) % 360
          }, 60%, 80%, ${0.3 + Math.random() * 0.3})`;
          p.reflection = Math.random() * Math.PI * 2;
          break;

        case "stars":
          p.x = Math.random() * w;
          p.y = Math.random() * h;
          p.size = Math.random() * 2 + 1;
          p.speedX = (Math.random() - 0.5) * 0.1;
          p.speedY = (Math.random() - 0.5) * 0.1;
          p.color = `hsla(60, ${30 + Math.random() * 50}%, ${
            80 + Math.random() * 20
          }%, 1)`;
          p.twinkle = Math.random() * Math.PI * 2;
          p.twinkleSpeed = Math.random() * 0.05 + 0.02;
          break;

        case "fireflies":
          p.x = Math.random() * w;
          p.y = Math.random() * h;
          p.size = Math.random() * 3 + 2;
          p.speedX = (Math.random() - 0.5) * 0.5 * speed;
          p.speedY = (Math.random() - 0.5) * 0.5 * speed;
          p.targetX = Math.random() * w;
          p.targetY = Math.random() * h;
          p.color = getColor(
            60 + Math.random() * 30,
            100,
            60 + Math.random() * 30
          );
          p.glow = Math.random() * Math.PI * 2;
          break;

        case "energy":
          p.x = cx;
          p.y = cy;
          p.size = Math.random() * 2 + 1;
          p.speedX = (Math.random() - 0.5) * 6 * speed;
          p.speedY = (Math.random() - 0.5) * 6 * speed;
          p.color = getColor(Math.random() * 120, 100, 50 + Math.random() * 40);
          p.life = 50 + Math.random() * 50;
          p.trail = [];
          break;

        case "glitter":
          p.x = Math.random() * w;
          p.y = Math.random() * h;
          p.size = Math.random() * 4 + 2;
          p.speedX = (Math.random() - 0.5) * 0.2;
          p.speedY = (Math.random() - 0.5) * 0.2;
          p.rotation = Math.random() * Math.PI * 2;
          p.rotationSpeed = (Math.random() - 0.5) * 0.1;
          p.color = `hsla(${this.baseHue}, 80%, ${
            70 + Math.random() * 20
          }%, 1)`;
          p.life = 30 + Math.random() * 70;
          p.sparkle = Math.random() * Math.PI * 2;
          break;

        case "smoke":
          p.x = cx + (Math.random() - 0.5) * di.drawWidth * 0.3;
          p.y = h - 50;
          p.size = Math.random() * 20 + 10;
          p.speedX = (Math.random() - 0.5) * 0.3 * speed;
          p.speedY = -(Math.random() * 0.5 + 0.2) * speed;
          p.color = `hsla(${this.baseHue}, 10%, ${40 + Math.random() * 20}%, ${
            0.1 + Math.random() * 0.2
          })`;
          p.drift = Math.random() * Math.PI * 2;
          break;

        case "magic":
          p.x = cx + (Math.random() - 0.5) * di.drawWidth * 0.5;
          p.y = cy + (Math.random() - 0.5) * di.drawHeight * 0.5;
          p.size = Math.random() * 4 + 2;
          p.speedX = (Math.random() - 0.5) * 2 * speed;
          p.speedY = (Math.random() - 0.5) * 2 * speed;
          p.color = getColor(
            270 + Math.random() * 60,
            100,
            60 + Math.random() * 30
          );
          p.orbit = Math.random() * Math.PI * 2;
          p.orbitSpeed = (Math.random() - 0.5) * 0.05;
          break;

        case "aurora":
          p.x = Math.random() * w;
          p.y = Math.random() * h * 0.3;
          p.size = Math.random() * 30 + 20;
          p.speedX = (Math.random() - 0.5) * 0.2;
          p.color = getColor(
            180 + Math.random() * 60,
            80,
            40 + Math.random() * 20
          );
          p.wave = Math.random() * Math.PI * 2;
          p.amplitude = Math.random() * 20 + 10;
          break;

        case "nebula":
          p.x = Math.random() * w;
          p.y = Math.random() * h;
          p.size = Math.random() * 40 + 20;
          p.speedX = (Math.random() - 0.5) * 0.1;
          p.speedY = (Math.random() - 0.5) * 0.1;
          p.color = getColor(
            280 + Math.random() * 80,
            60 + Math.random() * 30,
            30 + Math.random() * 30
          );
          p.pulse = Math.random() * Math.PI * 2;
          break;
      }
      return p;
    }

    updateParticle(p, canvas, speed) {
      // Misma lógica de actualización que en el editor
      switch (p.effect) {
        case "snow":
          p.x += Math.sin(p.wobble) * 0.3;
          p.wobble += 0.05;
          p.y += p.speedY * p.speedZ;
          p.x += p.speedX;
          p.rotation += p.rotationSpeed;
          break;
        case "rain":
          p.y += p.speedY;
          p.x += p.speedX;
          // Loop simple para lluvia
          if (p.y > canvas.height + p.length) p.y = -p.length;
          break;
        case "fireflies":
          const dx = p.targetX - p.x;
          const dy = p.targetY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 10 || Math.random() < 0.01) {
            p.targetX = Math.random() * canvas.width;
            p.targetY = Math.random() * canvas.height;
          }
          p.x += (dx / dist) * 0.5;
          p.y += (dy / dist) * 0.5;
          p.x += p.speedX;
          p.y += p.speedY;
          break;
        case "energy":
          p.x += p.speedX;
          p.y += p.speedY;
          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > 5) p.trail.shift();
          break;
        case "aurora":
          p.x += p.speedX;
          p.y += Math.sin(p.wave) * 0.5;
          p.wave += 0.03;
          break;
        default:
          p.x += p.speedX || 0;
          p.y += p.speedY || 0;
          if (p.rotation !== undefined) p.rotation += p.rotationSpeed;
      }

      p.life -= 0.5;
    }

    checkReset(p, canvas) {
      if (p.effect === "rain") return false; // La lluvia se maneja en el update para loop suave
      return (
        p.life <= 0 ||
        p.y > canvas.height + 100 ||
        p.y < -100 ||
        p.x > canvas.width + 100 ||
        p.x < -100
      );
    }

    drawParticle(ctx, p) {
      ctx.save();

      // Solución al BUG DE LA LLUVIA:
      // En el editor se usa translate, por lo tanto dibujamos en 0,0
      // La lluvia se dibuja como un rectángulo fino para simular el stroke

      switch (p.effect) {
        case "snow":
          ctx.globalAlpha = 0.8;
          ctx.fillStyle = p.color;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            ctx.lineTo(
              Math.cos((Math.PI / 3) * i) * p.size,
              Math.sin((Math.PI / 3) * i) * p.size
            );
          }
          ctx.fill();
          break;

        case "rain":
          ctx.fillStyle = p.color; // Usamos fillStyle que imita el strokeStyle
          ctx.globalAlpha = 0.7;
          ctx.translate(p.x, p.y);
          // Dibujamos un rectangulo de ancho 1 (como una línea) y altura 'length'
          // Ajustamos coordenadas relativas al translate
          ctx.fillRect(0, -p.length, 1.5, p.length);
          break;

        case "leaves":
          ctx.fillStyle = p.color;
          ctx.globalAlpha = 0.9;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.beginPath();
          ctx.moveTo(0, -p.size / 2);
          ctx.quadraticCurveTo(p.size / 2, 0, 0, p.size / 2);
          ctx.quadraticCurveTo(-p.size / 2, 0, 0, -p.size / 2);
          ctx.fill();
          break;

        case "hearts":
          // Lógica de pulso
          const pulseSize = p.size * (0.9 + Math.sin(p.pulse || 0) * 0.1);
          if (p.pulse !== undefined) p.pulse += 0.1;

          ctx.fillStyle = p.color;
          ctx.globalAlpha = 0.9;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.beginPath();
          ctx.moveTo(0, pulseSize / 4);
          ctx.bezierCurveTo(
            -pulseSize / 2,
            -pulseSize / 2,
            -pulseSize,
            pulseSize / 3,
            0,
            pulseSize
          );
          ctx.bezierCurveTo(
            pulseSize,
            pulseSize / 3,
            pulseSize / 2,
            -pulseSize / 2,
            0,
            pulseSize / 4
          );
          ctx.fill();
          break;

        case "confetti":
          ctx.fillStyle = p.color;
          ctx.globalAlpha = 0.9;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          if (p.shape === 0) {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          } else if (p.shape === 1) {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.moveTo(0, -p.size / 2);
            ctx.lineTo(p.size / 2, p.size / 2);
            ctx.lineTo(-p.size / 2, p.size / 2);
            ctx.closePath();
            ctx.fill();
          }
          break;

        case "bubbles":
          ctx.fillStyle = p.color;
          ctx.strokeStyle = `hsla(${this.baseHue}, 100%, 100%, 0.3)`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          // Reflejo
          ctx.fillStyle = `hsla(${this.baseHue}, 100%, 100%, 0.2)`;
          ctx.beginPath();
          ctx.arc(
            p.x - p.size / 3,
            p.y - p.size / 3,
            p.size / 4,
            0,
            Math.PI * 2
          );
          ctx.fill();
          break;

        case "stars":
          const twinkle = 0.7 + Math.sin(p.twinkle) * 0.3;
          p.twinkle += p.twinkleSpeed;
          ctx.fillStyle = p.color;
          ctx.globalAlpha = twinkle;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;

        case "fireflies":
          const glow = 0.5 + Math.sin(p.glow) * 0.5;
          p.glow += 0.1;
          ctx.fillStyle = p.color;
          ctx.globalAlpha = glow;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
          ctx.fillStyle = p.color.replace(")", ", 0.2)").replace("hsl", "hsla");
          ctx.fill();
          break;

        case "energy":
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size;
          ctx.lineCap = "round";
          ctx.globalAlpha = p.life / p.maxLife;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          for (let i = 0; i < p.trail.length; i++) {
            ctx.lineTo(p.trail[i].x, p.trail[i].y);
          }
          ctx.stroke();
          break;

        case "glitter":
          const sparkle = 0.5 + Math.sin(p.sparkle) * 0.5;
          p.sparkle += 0.2;
          ctx.fillStyle = p.color;
          ctx.globalAlpha = sparkle;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          break;

        case "smoke":
          ctx.fillStyle = p.color;
          ctx.globalAlpha = (p.life / p.maxLife) * 0.3;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;

        case "magic":
          ctx.fillStyle = p.color;
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = p.color
            .replace(")", ", 0.3)")
            .replace("hsl", "hsla");
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.speedX * 3, p.y - p.speedY * 3);
          ctx.stroke();
          break;

        case "aurora":
          ctx.fillStyle = p.color;
          ctx.globalAlpha = 0.1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;

        case "nebula":
          ctx.fillStyle = p.color;
          ctx.globalAlpha = 0.05;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;

        default:
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life / p.maxLife;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
      }

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

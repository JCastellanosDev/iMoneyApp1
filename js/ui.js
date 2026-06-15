// Shared UI utilities for all FinFlow screens.
// Requires api.js to be loaded first (uses window.API.fmt).
(function () {
  /** Escapes HTML entities before inserting user data into innerHTML. */
  window.esc = function (s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  window.ICONO_CAT = {
    Comida: "restaurant",
    Transporte: "directions_car",
    Compras: "shopping_cart",
    Servicios: "receipt_long",
    Salud: "medical_services",
    Entretenimiento: "sports_esports",
    Vivienda: "home",
    Ocio: "celebration",
    Nomina: "payments",
    "Nómina": "payments",
    Otros: "payments",
  };

  window.fechaCorta = function (iso) {
    const d = new Date(iso);
    const hoy = new Date();
    const hora = d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    if (d.toDateString() === hoy.toDateString()) return "Hoy, " + hora;
    if (new Date(hoy.getTime() - 86400000).toDateString() === d.toDateString()) return "Ayer, " + hora;
    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" }) + ", " + hora;
  };

  window.animarContador = function (el, target, dur, fmt) {
    dur = dur || 1100;
    fmt = fmt || function (n) { return Math.round(n) + "%"; };
    const t0 = performance.now();
    (function frame(now) {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(frame);
    })(performance.now());
  };

  /**
   * Draws a donut chart inside `svgEl` using the `distribucion` array,
   * and populates `legendEl` with colour-coded category labels.
   */
  window.pintarDonut = function (svgEl, distribucion, legendEl) {
    const NS = "http://www.w3.org/2000/svg";
    let offset = 0;
    distribucion.forEach(function (d, i) {
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", "18");
      c.setAttribute("cy", "18");
      c.setAttribute("r", "15.915");
      c.setAttribute("fill", "none");
      c.setAttribute("stroke", d.color);
      c.setAttribute("stroke-width", "4");
      c.setAttribute("stroke-linecap", "butt");
      c.setAttribute("stroke-dashoffset", String(-offset % 100));
      c.style.strokeDasharray = "0 100";
      c.style.transition = "stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1)";
      c.style.transitionDelay = i * 0.12 + "s";
      svgEl.appendChild(c);
      const objetivo = d.porcentaje + " " + (100 - d.porcentaje);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { c.style.strokeDasharray = objetivo; });
      });
      offset += d.porcentaje;
    });
    if (legendEl) {
      legendEl.innerHTML =
        distribucion
          .slice(0, 6)
          .map(function (d) {
            return (
              '<div class="flex items-center gap-sm">' +
              '<div class="w-3 h-3 rounded-full flex-shrink-0 mt-1" style="background:' + d.color + '"></div>' +
              '<div class="min-w-0 leading-tight">' +
              '<span class="font-label-sm text-label-sm text-on-surface block">' + esc(d.categoria) + "</span>" +
              '<span class="font-label-sm text-label-sm text-on-surface-variant">' + API.fmt(d.monto) + "</span>" +
              "</div>" +
              "</div>"
            );
          })
          .join("") || '<span class="font-label-sm text-on-surface-variant">Sin gastos</span>';
    }
  };

  /** Renders a list of recent transactions into `containerEl`. */
  window.pintarRecientes = function (containerEl, lista) {
    if (!lista.length) {
      containerEl.innerHTML = '<p class="text-label-sm text-on-surface-variant">Sin transacciones aún.</p>';
      return;
    }
    containerEl.innerHTML = lista
      .map(function (t) {
        const ingreso = t.tipo === "ingreso";
        const iconoBg  = ingreso ? "bg-primary-container text-on-primary-container" : "bg-error-container text-error";
        const montoClr = ingreso ? "text-primary" : "text-error";
        return (
          '<div class="flex items-center justify-between group">' +
          '<div class="flex items-center gap-sm">' +
          '<div class="w-12 h-12 rounded-xl ' + iconoBg + ' flex items-center justify-center">' +
          '<span class="material-symbols-outlined">' + (ICONO_CAT[t.categoria] || "payments") + "</span>" +
          "</div>" +
          "<div>" +
          '<p class="font-body-md text-body-md text-on-surface font-semibold">' + esc(t.descripcion) + "</p>" +
          '<p class="font-label-sm text-label-sm text-on-surface-variant">' + fechaCorta(t.fecha) + "</p>" +
          "</div>" +
          "</div>" +
          '<p class="font-body-md text-body-md ' + montoClr + ' font-bold">' +
          (ingreso ? "+" : "-") + API.fmt(t.monto) +
          "</p>" +
          "</div>"
        );
      })
      .join("");
  };
})();

let deferredPrompt = null;

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
}

function setupInstallButton() {
  const button = document.querySelector(".install-button");
  if (!button) {
    return;
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    button.hidden = false;
  });

  button.addEventListener("click", async () => {
    if (!deferredPrompt) {
      return;
    }
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    button.hidden = true;
  });
}

function setupRevealAnimation() {
  const elements = document.querySelectorAll(".section, .glass-card, .trust-strip, .app-card");
  if (!elements.length || !("IntersectionObserver" in window)) {
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  }, { threshold: 0.16 });

  elements.forEach((element) => {
    element.classList.add("reveal");
    observer.observe(element);
  });
}

function createFilePill(name, size) {
  const pill = document.createElement("div");
  pill.className = "file-pill";
  const sizeText = typeof size === "number" ? ` (${formatBytes(size)})` : "";
  pill.textContent = `${name}${sizeText}`;
  return pill;
}

function formatBytes(bytes) {
  if (!bytes) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(1)} ${units[index]}`;
}

function setupUploadForm() {
  const form = document.querySelector("#clean-form");
  const input = document.querySelector("#file-input");
  const fileList = document.querySelector("#file-list");
  const statusLine = document.querySelector("#status-line");
  const submitButton = document.querySelector("#submit-button");
  const resultBox = document.querySelector("#result-box");

  if (!form || !input || !fileList || !statusLine || !submitButton || !resultBox) {
    return;
  }

  input.addEventListener("change", () => {
    fileList.innerHTML = "";
    const file = input.files && input.files[0];
    if (!file) {
      return;
    }
    fileList.appendChild(createFilePill(file.name, file.size));
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = input.files && input.files[0];
    if (!file) {
      statusLine.textContent = "Ajoute un fichier avant de lancer le nettoyage.";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("strip_metadata", String(Boolean(form.elements.strip_metadata.checked)));
    formData.append("compress_output", String(Boolean(form.elements.compress_output.checked)));
    formData.append("redact_visible_text", String(Boolean(form.elements.redact_visible_text.checked)));
    formData.append("remove_audio", String(Boolean(form.elements.remove_audio.checked)));

    submitButton.disabled = true;
    statusLine.textContent = "Traitement en cours...";
    resultBox.innerHTML = "<p>Analyse, nettoyage et compression en cours.</p>";

    try {
      const response = await fetch("/api/process", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ detail: "Erreur inconnue" }));
        throw new Error(payload.detail || "Traitement impossible");
      }

      const blob = await response.blob();
      const filename = getFilenameFromHeaders(response.headers) || `CLEANED_${file.name}`;
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(downloadUrl);

      const originalBytes = Number(response.headers.get("X-Original-Bytes") || 0);
      const outputBytes = Number(response.headers.get("X-Output-Bytes") || 0);
      const reduction = response.headers.get("X-Reduction-Percent") || "0.0";
      const warnings = response.headers.get("X-Warnings") || "";

      statusLine.textContent = "Nettoyage termine. Le telechargement a demarre.";
      resultBox.innerHTML = "";
      resultBox.appendChild(createFilePill(filename, outputBytes));

      const stats = document.createElement("p");
      stats.className = "result-stats";
      stats.textContent = `${formatBytes(originalBytes)} -> ${formatBytes(outputBytes)} (${reduction}% de reduction)`;
      resultBox.appendChild(stats);

      if (warnings) {
        const warning = document.createElement("p");
        warning.className = "result-warning";
        warning.textContent = warnings;
        resultBox.appendChild(warning);
      }
    } catch (error) {
      statusLine.textContent = "Echec du traitement.";
      resultBox.innerHTML = `<p class="result-warning">${error.message}</p>`;
    } finally {
      submitButton.disabled = false;
    }
  });
}

function getFilenameFromHeaders(headers) {
  const disposition = headers.get("content-disposition");
  if (!disposition) {
    return "";
  }
  const match = disposition.match(/filename="?([^"]+)"?/i);
  return match ? match[1] : "";
}

registerServiceWorker();
setupInstallButton();
setupRevealAnimation();
setupUploadForm();

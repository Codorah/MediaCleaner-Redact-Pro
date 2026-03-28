import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import DragDropZone from "../components/DragDropZone";
import OptionsPanel from "../components/OptionsPanel";
import ProcessingAnimation from "../components/ProcessingAnimation";
import ResultCard from "../components/ResultCard";
import Stepper from "../components/Stepper";

const initialOptions = {
  strip_metadata: true,
  compress_output: true,
  redact_visible_text: false,
  remove_audio: false,
};

const presetOptions = {
  low: {
    strip_metadata: true,
    compress_output: false,
    redact_visible_text: false,
    remove_audio: false,
  },
  medium: {
    strip_metadata: true,
    compress_output: true,
    redact_visible_text: false,
    remove_audio: false,
  },
  high: {
    strip_metadata: true,
    compress_output: true,
    redact_visible_text: true,
    remove_audio: true,
  },
};

const steps = [
  { id: "upload", label: "Fichier" },
  { id: "options", label: "Options" },
  { id: "process", label: "Traitement" },
  { id: "result", label: "Résultat" },
];

function getFilenameFromDisposition(disposition) {
  if (!disposition) return "";
  const match = disposition.match(/filename="?([^"]+)"?/i);
  return match ? match[1] : "";
}

export default function RedactTab({ historyEnabled, onAddHistoryEntry }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [file, setFile] = useState(null);
  const [preset, setPreset] = useState("medium");
  const [options, setOptions] = useState(presetOptions.medium);
  const [inspection, setInspection] = useState(null);
  const [inspectionLoading, setInspectionLoading] = useState(false);
  const [inspectionError, setInspectionError] = useState("");
  const [status, setStatus] = useState("Prêt.");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [downloadState, setDownloadState] = useState({ url: "", filename: "" });

  useEffect(() => {
    if (preset !== "custom") {
      setOptions(presetOptions[preset] || initialOptions);
    }
  }, [preset]);

  useEffect(() => {
    if (!file) {
      setInspection(null);
      setInspectionError("");
      setInspectionLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function inspectSelectedFile() {
      setInspectionLoading(true);
      setInspectionError("");

      try {
        const formData = new FormData();
        formData.append("file", file);
        const apiUrl = import.meta.env.VITE_API_URL || "";
        const response = await fetch(`${apiUrl}/api/inspect`, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        let errorMessage = "Impossible d'analyser les métadonnées.";
        if (!response.ok) {
          try {
            const errorPayload = await response.json();
            if (typeof errorPayload?.detail === "string" && errorPayload.detail.trim()) {
              errorMessage = errorPayload.detail;
            }
          } catch {
            // Keep the default error message if the backend did not return JSON.
          }
          throw new Error(errorMessage);
        }

        const payload = await response.json();
        if (!cancelled) {
          setInspection(payload);
        }
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }
        if (!cancelled) {
          setInspection(null);
          setInspectionError(error.message || "Impossible d'analyser les métadonnées.");
        }
      } finally {
        if (!cancelled) {
          setInspectionLoading(false);
        }
      }
    }

    inspectSelectedFile();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [file]);

  async function startProcessing() {
    if (!file) return;

    setStepIndex(2);
    setStatus("Analyse et nettoyage en cours...");
    setProgress(10);
    setResult(null);

    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 95) return current;
        const incr = current < 80 ? Math.random() * 5 : Math.random() * 1.5;
        return current + incr;
      });
    }, 500);

    try {
      const formData = new FormData();
      formData.append("file", file);
      Object.entries(options).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      const apiUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(`${apiUrl}/api/process`, {
        method: "POST",
        body: formData,
      });

      let errorMessage = "Erreur serveur lors du traitement.";
      if (!response.ok) {
        try {
          const errorPayload = await response.json();
          if (typeof errorPayload?.detail === "string" && errorPayload.detail.trim()) {
            errorMessage = errorPayload.detail;
          }
        } catch {
          // Keep the default error message when the backend returns plain text or no body.
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const filename = getFilenameFromDisposition(response.headers.get("content-disposition")) || `CLEANED_${file.name}`;
      const downloadUrl = URL.createObjectURL(blob);

      const nextResult = {
        filename,
        originalBytes: Number(response.headers.get("x-original-bytes") || 0),
        outputBytes: Number(response.headers.get("x-output-bytes") || 0),
        reductionPercent: response.headers.get("x-reduction-percent") || "0.0",
        warnings: response.headers.get("x-warnings") || "",
      };

      setDownloadState({ url: downloadUrl, filename });
      setResult(nextResult);
      setProgress(100);
      setStatus("Terminé.");

      if (historyEnabled && onAddHistoryEntry) {
        onAddHistoryEntry({
          id: `${Date.now()}-${filename}`,
          sourceName: file.name,
          filename,
          originalBytes: nextResult.originalBytes,
          outputBytes: nextResult.outputBytes,
          reductionPercent: nextResult.reductionPercent,
          warnings: nextResult.warnings,
          createdAt: new Date().toISOString(),
        });
      }

      setTimeout(() => setStepIndex(3), 600);
    } catch (error) {
      setStatus(error.message || "Traitement impossible.");
      setProgress(0);
      setStepIndex(1);
    } finally {
      window.clearInterval(timer);
    }
  }

  const handleNext = () => {
    if (stepIndex === 0 && file) setStepIndex(1);
    else if (stepIndex === 1) startProcessing();
    else if (stepIndex === 3) handleReset();
  };

  const handleBack = () => {
    if (stepIndex > 0 && stepIndex !== 2 && stepIndex !== 3) {
      setStepIndex(stepIndex - 1);
    }
  };

  const handleDownload = () => {
    if (!downloadState.url) return;
    const link = document.createElement("a");
    link.href = downloadState.url;
    link.download = downloadState.filename;
    link.click();
  };

  const handleReset = () => {
    setStepIndex(0);
    setFile(null);
    setInspection(null);
    setInspectionError("");
    setInspectionLoading(false);
    setResult(null);
    setProgress(0);
    setStatus("Prêt.");
    setPreset("medium");
    setOptions(presetOptions.medium);
  };

  const handleOptionToggle = (key) => {
    setOptions((current) => {
      const nextOptions = { ...current, [key]: !current[key] };
      const matchedPreset = Object.entries(presetOptions).find(([, presetValue]) =>
        Object.keys(presetValue).every((optionKey) => presetValue[optionKey] === nextOptions[optionKey])
      );
      setPreset(matchedPreset ? matchedPreset[0] : "custom");
      return nextOptions;
    });
  };

  const handlePresetChange = (nextPreset) => {
    setPreset(nextPreset);
    if (nextPreset !== "custom") {
      setOptions(presetOptions[nextPreset]);
    }
  };

  const nextLabel = stepIndex === 0 ? "Options" : stepIndex === 1 ? "Nettoyer" : stepIndex === 2 ? "..." : "Nouveau fichier";

  return (
    <div className="flex flex-col h-full mt-8 pb-10">
      <div className="w-full max-w-4xl mx-auto mb-10">
        <Stepper steps={steps} currentStep={stepIndex} />
      </div>

      <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {stepIndex === 0 && <DragDropZone key="upload" selectedFile={file} onFileSelect={setFile} />}
          {stepIndex === 1 && (
            <OptionsPanel
              key="options"
              options={options}
              preset={preset}
              inspection={inspection}
              inspectionLoading={inspectionLoading}
              inspectionError={inspectionError}
              onPresetChange={handlePresetChange}
              onOptionToggle={handleOptionToggle}
            />
          )}
          {stepIndex === 2 && <ProcessingAnimation key="process" progress={progress} status={status} />}
          {stepIndex === 3 && <ResultCard key="result" result={result} onDownload={handleDownload} onReset={handleReset} />}
        </AnimatePresence>
      </div>

      {stepIndex !== 2 && stepIndex !== 3 && (
        <div className="glass-panel glass-panel-solid w-full max-w-4xl mx-auto mt-8 flex justify-between items-center p-4 rounded-[1.5rem]">
          <button onClick={handleBack} className="cp-action-ghost disabled:opacity-40" disabled={stepIndex === 0}>
            Retour
          </button>
          <button onClick={handleNext} disabled={stepIndex === 0 && !file} className="cp-action-primary disabled:opacity-50">
            {nextLabel}
          </button>
        </div>
      )}
    </div>
  );
}

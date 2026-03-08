import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import DragDropZone from "../components/DragDropZone";
import OptionsPanel from "../components/OptionsPanel";
import ProcessingAnimation from "../components/ProcessingAnimation";
import ResultCard from "../components/ResultCard";
import Stepper from "../components/Stepper";

const initialOptions = {
    strip_metadata: true,
    compress_output: true,
    redact_visible_text: false,
    remove_audio: false
};

const steps = [
    { id: "upload", label: "Fichier" },
    { id: "options", label: "Options" },
    { id: "process", label: "Traitement" },
    { id: "result", label: "Résultat" }
];

function getFilenameFromDisposition(disposition) {
    if (!disposition) return "";
    const match = disposition.match(/filename="?([^"]+)"?/i);
    return match ? match[1] : "";
}

export default function RedactTab() {
    const [stepIndex, setStepIndex] = useState(0);
    const [file, setFile] = useState(null);
    const [preset, setPreset] = useState("medium");
    const [options, setOptions] = useState(initialOptions);

    const [status, setStatus] = useState("Prêt.");
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [downloadState, setDownloadState] = useState({ url: "", filename: "" });

    async function startProcessing() {
        if (!file) return;
        setStepIndex(2);
        setStatus("Analyse et nettoyage en cours...");
        setProgress(10);
        setResult(null);

        const timer = window.setInterval(() => {
            setProgress((current) => (current >= 90 ? current : current + Math.random() * 8));
        }, 400);

        try {
            const formData = new FormData();
            formData.append("file", file);
            Object.entries(options).forEach(([key, value]) => {
                formData.append(key, String(value));
            });

            const API_URL = import.meta.env.VITE_API_URL || "";
            const response = await fetch(`${API_URL}/api/process`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) throw new Error("Erreur serveur lors du traitement.");

            const blob = await response.blob();
            const filename = getFilenameFromDisposition(response.headers.get("content-disposition")) || `CLEANED_${file.name}`;
            const downloadUrl = URL.createObjectURL(blob);

            const nextResult = {
                filename,
                originalBytes: Number(response.headers.get("x-original-bytes") || 0),
                outputBytes: Number(response.headers.get("x-output-bytes") || 0),
                reductionPercent: response.headers.get("x-reduction-percent") || "0.0",
                warnings: response.headers.get("x-warnings") || ""
            };

            setDownloadState({ url: downloadUrl, filename });
            setResult(nextResult);
            setProgress(100);
            setStatus("Terminé !");

            setTimeout(() => setStepIndex(3), 600);

        } catch (error) {
            setStatus(error.message);
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
        if (downloadState.url) {
            const link = document.createElement("a");
            link.href = downloadState.url;
            link.download = downloadState.filename;
            link.click();
        }
    };

    const handleReset = () => {
        setStepIndex(0);
        setFile(null);
        setResult(null);
        setProgress(0);
    };

    const nextLabel = stepIndex === 0 ? "Options" :
        stepIndex === 1 ? "Nettoyer" :
            stepIndex === 2 ? "..." : "Nouveau Fichier";

    return (
        <div className="flex flex-col h-full mt-8">
            <div className="w-full max-w-3xl mx-auto mb-8">
                <Stepper steps={steps} currentStep={stepIndex} />
            </div>

            <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col justify-center">
                <AnimatePresence mode="wait">
                    {stepIndex === 0 && <DragDropZone key="upload" selectedFile={file} onFileSelect={setFile} />}
                    {stepIndex === 1 && <OptionsPanel key="options" options={options} setOptions={setOptions} preset={preset} setPreset={setPreset} />}
                    {stepIndex === 2 && <ProcessingAnimation key="process" progress={progress} status={status} />}
                    {stepIndex === 3 && <ResultCard key="result" result={result} onDownload={handleDownload} onReset={handleReset} />}
                </AnimatePresence>
            </div>

            {stepIndex !== 2 && stepIndex !== 3 && (
                <div className="w-full max-w-3xl mx-auto mt-8 flex justify-between items-center glass-panel p-4 rounded-2xl">
                    <button
                        onClick={handleBack}
                        className="px-6 py-3 rounded-xl text-white font-medium hover:bg-white/5 transition-colors disabled:opacity-30"
                    >
                        Retour
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={stepIndex === 0 && !file}
                        className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {nextLabel}
                    </button>
                </div>
            )}
        </div>
    );
}

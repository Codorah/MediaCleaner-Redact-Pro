import { motion } from "framer-motion";
import ThreeDFileIcon from "./3DFileIcon";

export default function ProcessingAnimation({ progress, status }) {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto py-12">
      <div className="relative w-72 h-72 mb-10">
        <ThreeDFileIcon cleaning={true} className="w-full h-full" />

        <motion.div
          className="absolute inset-x-8 h-1 rounded-full bg-accent shadow-[0_0_24px_rgba(0,217,160,0.55)] z-10"
          animate={{ top: ["15%", "82%", "15%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="glass-panel glass-panel-solid w-full p-6 rounded-[1.75rem] relative overflow-hidden">
        <div className="absolute inset-0 opacity-50 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(36,107,255,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.12),transparent_30%)]" />
        <div className="flex justify-between items-end mb-4 relative z-10">
          <div>
            <p className="cp-label mb-2">Traitement en cours</p>
            <p className="cp-soft font-medium">{status}</p>
          </div>
          <span className="cp-title text-4xl font-display font-bold text-accent">{progress}%</span>
        </div>

        <div className="w-full h-3 bg-[var(--app-card)] rounded-full overflow-hidden relative z-10">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}

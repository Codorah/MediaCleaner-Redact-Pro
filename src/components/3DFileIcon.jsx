import { motion } from "framer-motion";
import clsx from "clsx";

export default function ThreeDFileIcon({ cleaning = false, className = "h-64 w-full" }) {
  return (
    <div className={clsx("relative overflow-hidden", className)}>
      <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_20%_20%,rgba(36,107,255,0.2),transparent_30%),radial-gradient(circle_at_80%_25%,rgba(20,184,166,0.2),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />

      <motion.div
        className="absolute left-1/2 top-1/2 h-[76%] w-[56%] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0.04))] shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-md"
        animate={
          cleaning
            ? {
                rotate: [-4, 4, -4],
                y: [-8, 8, -8],
                scale: [1, 1.03, 1],
              }
            : {
                rotate: [-2, 2, -2],
                y: [-4, 4, -4],
              }
        }
        transition={{
          duration: cleaning ? 2.4 : 4.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="absolute inset-0 rounded-[2rem] bg-[linear-gradient(160deg,rgba(255,255,255,0.18),rgba(255,255,255,0.02))]" />
        <div className="absolute left-[14%] top-[12%] h-[12%] w-[46%] rounded-full bg-white/18" />
        <div className="absolute left-[14%] top-[32%] h-[7%] w-[68%] rounded-full bg-white/10" />
        <div className="absolute left-[14%] top-[46%] h-[7%] w-[58%] rounded-full bg-white/10" />
        <div className="absolute left-[14%] top-[60%] h-[7%] w-[62%] rounded-full bg-white/10" />

        <motion.div
          className={clsx(
            "absolute bottom-[14%] right-[14%] h-10 w-10 rounded-2xl shadow-[0_0_28px_rgba(0,0,0,0.2)]",
            cleaning ? "bg-accent/90" : "bg-primary/90"
          )}
          animate={cleaning ? { scale: [1, 1.18, 1], rotate: [0, 8, -8, 0] } : { scale: [1, 1.06, 1] }}
          transition={{ duration: cleaning ? 1.1 : 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {cleaning && (
        <motion.div
          className="absolute inset-x-[16%] h-1 rounded-full bg-accent shadow-[0_0_24px_rgba(0,217,160,0.55)]"
          animate={{ top: ["18%", "80%", "18%"] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        />
      )}
    </div>
  );
}

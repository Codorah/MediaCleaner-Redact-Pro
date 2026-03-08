import { motion } from 'framer-motion';
import ThreeDFileIcon from './3DFileIcon';

export default function ProcessingAnimation({ progress, status }) {
    return (
        <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto py-12">

            <div className="relative w-64 h-64 mb-12">
                <ThreeDFileIcon cleaning={true} className="w-full h-full" />

                {/* Particle scanning effect */}
                <motion.div
                    className="absolute inset-x-0 h-1 bg-accent shadow-[0_0_20px_#00F5A0] z-10"
                    animate={{ top: ['10%', '90%', '10%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />
            </div>

            <div className="w-full glass-panel p-6 rounded-2xl relative overflow-hidden">
                <div className="flex justify-between items-end mb-4 relative z-10">
                    <p className="text-gray-300 font-medium">{status}</p>
                    <span className="text-3xl font-display font-bold text-accent">{progress}%</span>
                </div>

                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden relative z-10">
                    <motion.div
                        className="h-full bg-gradient-to-r from-primary to-accent"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: 'easeOut' }}
                    />
                </div>
            </div>
        </div>
    );
}

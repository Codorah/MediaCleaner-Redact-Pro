import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function Stepper({ steps, currentStep }) {
    return (
        <div className="w-full flex items-center justify-between relative mb-12">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/10 rounded-full z-0" />
            <motion.div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0"
                initial={{ width: '0%' }}
                animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            />

            {steps.map((step, idx) => {
                const isActive = idx === currentStep;
                const isPast = idx < currentStep;

                return (
                    <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                        <motion.div
                            initial={false}
                            animate={{
                                backgroundColor: isActive || isPast ? '#FF3B5C' : '#111111',
                                borderColor: isActive || isPast ? '#FF3B5C' : 'rgba(255,255,255,0.2)',
                                scale: isActive ? 1.2 : 1
                            }}
                            className={clsx(
                                "w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold shadow-lg transition-colors duration-300",
                                isActive ? "text-white shadow-primary/50" : isPast ? "text-white" : "text-gray-500"
                            )}
                        >
                            {isPast ? <Check className="w-5 h-5" /> : idx + 1}
                        </motion.div>
                        <span className={clsx(
                            "text-xs font-medium absolute -bottom-6 whitespace-nowrap transition-colors duration-300",
                            isActive ? "text-white" : "text-gray-500"
                        )}>
                            {step.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

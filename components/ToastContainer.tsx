import React from 'react';
import { useStore } from '../context/StoreContext';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;

const ToastContainer = () => {
    const { toasts, removeToast } = useStore();

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
                {toasts.map(toast => (
                    <MotionDiv
                        key={toast.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        className={`pointer-events-auto flex items-center w-80 p-4 rounded-xl shadow-lg border ${toast.type === 'success' ? 'bg-white dark:bg-slate-800 border-emerald-100 dark:border-emerald-900/50 text-gray-800 dark:text-white' :
                                toast.type === 'error' ? 'bg-white dark:bg-slate-800 border-red-100 dark:border-red-900/50 text-gray-800 dark:text-white' :
                                    'bg-white dark:bg-slate-800 border-blue-100 dark:border-blue-900/50 text-gray-800 dark:text-white'
                            }`}
                    >
                        <div className={`mr-3 p-2 rounded-full flex-shrink-0 ${toast.type === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' :
                                toast.type === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' :
                                    'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                            }`}>
                            {toast.type === 'success' && <CheckCircle size={18} />}
                            {toast.type === 'error' && <AlertCircle size={18} />}
                            {toast.type === 'info' && <Info size={18} />}
                        </div>
                        <p className="flex-1 text-sm font-medium">{toast.message}</p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <X size={16} />
                        </button>
                    </MotionDiv>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default ToastContainer;

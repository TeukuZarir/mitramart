import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Info, Lock } from 'lucide-react';

const MotionDiv = motion.div as any;

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    type?: 'info' | 'warning' | 'success' | 'password';
    children: React.ReactNode;
    actions?: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, type = 'info', children, actions }: ModalProps) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const iconMap = {
        info: <Info className="text-blue-500" size={24} />,
        warning: <AlertTriangle className="text-amber-500" size={24} />,
        success: <CheckCircle className="text-emerald-500" size={24} />,
        password: <Lock className="text-blue-500" size={24} />,
    };

    const bgMap = {
        info: 'bg-blue-50 dark:bg-blue-900/20',
        warning: 'bg-amber-50 dark:bg-amber-900/20',
        success: 'bg-emerald-50 dark:bg-emerald-900/20',
        password: 'bg-blue-50 dark:bg-blue-900/20',
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <MotionDiv
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
                    />

                    {/* Modal */}
                    <MotionDiv
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl z-[101] overflow-hidden"
                    >
                        {/* Header */}
                        <div className={`p-4 ${bgMap[type]} flex items-center gap-3`}>
                            <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                                {iconMap[type]}
                            </div>
                            <h3 className="flex-1 font-bold text-gray-900 dark:text-white text-lg">{title}</h3>
                            <button
                                onClick={onClose}
                                className="p-1.5 hover:bg-white/50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                            {children}
                        </div>

                        {/* Actions */}
                        {actions && (
                            <div className="p-4 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3">
                                {actions}
                            </div>
                        )}
                    </MotionDiv>
                </>
            )}
        </AnimatePresence>
    );
};

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'info';
}

export const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Ya, Hapus',
    cancelText = 'Batal',
    type = 'warning'
}: ConfirmDialogProps) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            type={type}
            actions={
                <>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-4 py-2 rounded-xl font-bold transition-colors ${type === 'warning'
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                    >
                        {confirmText}
                    </button>
                </>
            }
        >
            <p className="text-gray-600 dark:text-gray-300">{message}</p>
        </Modal>
    );
};

interface PasswordDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (password: string) => void;
    userName: string;
}

export const PasswordDialog = ({ isOpen, onClose, onSubmit, userName }: PasswordDialogProps) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (password.length < 4) {
            setError('Password minimal 4 karakter');
            return;
        }
        onSubmit(password);
        setPassword('');
        setError('');
        onClose();
    };

    const handleClose = () => {
        setPassword('');
        setError('');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Edit Password"
            type="password"
            actions={
                <>
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors"
                    >
                        Simpan Password
                    </button>
                </>
            }
        >
            <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                    Masukkan password baru untuk <span className="font-bold text-gray-900 dark:text-white">{userName}</span>
                </p>
                <div>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setError('');
                        }}
                        placeholder="Password baru (min. 4 karakter)"
                        className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        autoFocus
                    />
                    {error && (
                        <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                            <AlertTriangle size={14} /> {error}
                        </p>
                    )}
                </div>
            </div>
        </Modal>
    );
};

interface InfoDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
}

export const InfoDialog = ({ isOpen, onClose, title, message }: InfoDialogProps) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            type="info"
            actions={
                <button
                    onClick={onClose}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors"
                >
                    Mengerti
                </button>
            }
        >
            <p className="text-gray-600 dark:text-gray-300">{message}</p>
        </Modal>
    );
};

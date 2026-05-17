import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(26,26,46,0.7)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 max-w-[480px] mx-auto bg-deep-indigo overflow-y-auto"
            style={{
              maxHeight: '60vh',
              borderTop: '2px solid #9b89c4',
              borderRadius: '8px 8px 0 0',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-8 h-1 rounded bg-muted-purple" />
            </div>
            <div className="flex justify-between items-center px-4 py-3 border-b border-muted-purple/30">
              <span className="font-bold text-[10px] text-cloud-white tracking-wide">{title}</span>
              <button
                onClick={onClose}
                className="text-muted-purple hover:text-cloud-white text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-4 pb-8">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

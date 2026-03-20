'use client';

import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

export default function ChatDrawer({ isOpen, onClose, children }: ChatDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[55] bg-black/30 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none md:pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            data-testid="chat-drawer"
            className="
              fixed z-[56] bg-white shadow-2xl overflow-hidden flex flex-col
              inset-x-0 bottom-0 top-0
              md:inset-x-auto md:top-4 md:right-4 md:bottom-4
              md:w-[420px] md:rounded-2xl md:border md:border-gray-200/50
            "
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-[#024F86] to-[#38B1E4]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">☁️</span>
                </div>
                <div>
                  <h2 className="text-white font-bold font-montserrat text-sm">Cloudinha</h2>
                  <p className="text-white/70 text-xs">Sua assistente educacional</p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Fechar chat"
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Chat Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {children || (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm p-4">
                  <p className="text-center">
                    Olá! Sou a Cloudinha 🌤️<br />
                    Como posso te ajudar hoje?
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

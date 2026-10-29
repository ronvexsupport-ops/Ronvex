import React, { useState } from 'react';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  defaultMessage?: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phoneNumber = '01954868068',
  defaultMessage = 'Hello RONVEX! I would like to inquire about your products.',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Normalize phone number for wa.me format (remove leading 0 and prepend 88 for Bangladesh if needed)
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  const internationalNumber = cleanNumber.startsWith('880')
    ? cleanNumber
    : cleanNumber.startsWith('0')
    ? `88${cleanNumber}`
    : `880${cleanNumber}`;

  const encodedMessage = encodeURIComponent(defaultMessage);
  const whatsappUrl = `https://wa.me/${internationalNumber}?text=${encodedMessage}`;

  return (
    <aside
      aria-label="Customer Support Contact"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 select-none"
    >
      {/* Tooltip Popup on Desktop Hover */}
      <div
        className={`hidden sm:flex items-center gap-2 bg-slate-900/95 backdrop-blur-md text-white text-xs font-medium py-2 px-3.5 rounded-full shadow-lg border border-slate-800 transition-all duration-300 pointer-events-none ${
          isHovered
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 translate-x-3 pointer-events-none'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Chat on WhatsApp</span>
        <span className="text-slate-400 font-mono text-[11px]">01954868068</span>
      </div>

      {/* Floating Action Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp (Phone: 01954868068)"
        title="Chat with RONVEX on WhatsApp: 01954868068"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative flex items-center justify-center w-14 h-14 sm:w-15 sm:h-15 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-2xl shadow-emerald-900/30 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer ring-4 ring-white/80 focus:outline-hidden focus:ring-4 focus:ring-emerald-400"
      >
        {/* Subtle pulsating radar ring */}
        <span
          className="absolute inset-0 rounded-full bg-[#25D366] opacity-30 animate-ping pointer-events-none"
          style={{ animationDuration: '3s' }}
        />

        {/* Online Status Pill Badge in Top-Right */}
        <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white shadow-xs flex items-center justify-center z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
        </span>

        {/* Official WhatsApp Logo SVG */}
        <svg
          viewBox="0 0 32 32"
          className="w-7 h-7 sm:w-8 sm:h-8 fill-white drop-shadow-xs transition-transform duration-200 group-hover:scale-105"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M16.002 0C7.164 0 0 7.164 0 16.001c0 2.827.738 5.484 2.032 7.789L.07 31.438l7.854-2.015A15.93 15.93 0 0 0 16.002 32C24.84 32 32 24.836 32 16.001 32 7.164 24.84 0 16.002 0zm9.324 22.607c-.389 1.096-1.927 2.008-2.674 2.132-.716.12-1.65.17-2.673-.162-.622-.202-1.423-.47-2.457-.92-4.375-1.905-7.218-6.33-7.436-6.623-.217-.294-1.782-2.37-1.782-4.521 0-2.152 1.127-3.208 1.528-3.649.389-.429.849-.539 1.134-.539.284 0 .568.003.817.016.262.013.612-.1.956.728.356.858 1.214 2.966 1.321 3.185.107.218.179.474.036.758-.143.284-.214.461-.428.716-.214.254-.45.568-.642.763-.214.218-.439.456-.19.882.25.427 1.11 1.83 2.383 2.966 1.637 1.462 3.018 1.916 3.447 2.13.428.214.678.179.928-.107.25-.285 1.07-1.248 1.356-1.676.285-.428.57-.356.963-.214.393.143 2.497 1.177 2.925 1.391.428.214.714.321.82.5.107.179.107 1.034-.282 2.13z" />
        </svg>
      </a>
    </aside>
  );
};

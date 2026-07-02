import React from 'react';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface FloatingWhatsAppProps {
  phoneNumber: string;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({ phoneNumber }) => {
  if (!phoneNumber) return null;

  // Formata o número (garante que apenas dígitos existam, se por acaso houver)
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // Mensagem padrão de saudação
  const message = encodeURIComponent('Olá, vim pelo site e gostaria de saber mais sobre o sistema Tauze!');
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${message}`;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 60,
        height: 60,
        backgroundColor: '#25D366', // Cor oficial do WhatsApp
        color: '#FFF',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 32px rgba(37, 211, 102, 0.4)',
        zIndex: 9999,
        textDecoration: 'none',
      }}
    >
      <MessageCircle size={32} />
    </motion.a>
  );
};

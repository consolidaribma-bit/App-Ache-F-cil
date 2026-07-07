import { useState } from 'react';
import { FiMic, FiX } from 'react-icons/fi';
import { requestVoiceInput, speakText } from '../utils/device';
import toast from 'react-hot-toast';

interface VoiceInputProps {
  onInput: (text: string) => void;
  placeholder?: string;
}

export default function VoiceInput({ onInput, placeholder = 'Fale agora...' }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);

  const handleVoiceInput = async () => {
    try {
      setIsListening(true);
      speakText('Você pode falar agora');
      const text = await requestVoiceInput();
      if (text.trim()) {
        onInput(text);
        toast.success('Item adicionado por voz!');
      }
    } catch (error) {
      toast.error('Erro ao capturar voz. Tente novamente.');
      console.error(error);
    } finally {
      setIsListening(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleVoiceInput}
        disabled={isListening}
        className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
          isListening
            ? 'bg-accent-500 text-white animate-pulse'
            : 'bg-accent-500 text-white hover:bg-accent-600 active:scale-95'
        }`}
      >
        <FiMic className="w-5 h-5" />
        {isListening ? 'Escutando...' : 'Por Voz'}
      </button>
    </div>
  );
}

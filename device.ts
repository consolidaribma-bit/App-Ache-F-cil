export const requestVoiceInput = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      reject(new Error('Reconhecimento de voz não suportado neste navegador'));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    let transcript = '';

    recognition.onstart = () => {
      console.log('Escutando...');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let currentTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      transcript = currentTranscript;
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      reject(new Error(`Erro no reconhecimento de voz: ${event.error}`));
    };

    recognition.onend = () => {
      resolve(transcript);
    };

    try {
      recognition.start();
    } catch (error) {
      reject(error);
    }
  });
};

export const speakText = (text: string, lang: string = 'pt-BR') => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }
};

export const requestGPS = (): Promise<GeolocationCoordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não suportada'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
};

export const watchGPS = (callback: (coords: GeolocationCoordinates) => void) => {
  if (!navigator.geolocation) {
    throw new Error('Geolocalização não suportada');
  }

  return navigator.geolocation.watchPosition(
    (position) => callback(position.coords),
    (error) => console.error('GPS Error:', error),
    { enableHighAccuracy: true }
  );
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('Notificações não suportadas');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

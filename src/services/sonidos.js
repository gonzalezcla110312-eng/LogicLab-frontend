// Función para reproducir sonido de timbre (3 pitidos agudos)
export const reproducirTimbre = () => {
  try {
    // Usar la Web Audio API para generar sonidos
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      console.error('Web Audio API no soportada en este navegador');
      reproducirTimbreAlternativo();
      return;
    }

    const audioContext = new AudioContext();
    
    // Crear tres pitidos rápidos y agudos
    const reproducirPitido = (startTime, duracion) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      // Sonido agudo y claro
      osc.frequency.value = 1200; // Hz
      osc.type = 'sine';
      
      // Envelope ADSR simple
      gain.gain.setValueAtTime(0.4, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duracion);
      
      osc.start(startTime);
      osc.stop(startTime + duracion);
    };
    
    // Reproducir 3 pitidos de 0.15 segundos cada uno, separados por 0.15 segundos
    const ahora = audioContext.currentTime;
    reproducirPitido(ahora, 0.15);
    reproducirPitido(ahora + 0.2, 0.15);
    reproducirPitido(ahora + 0.4, 0.15);
    
  } catch (error) {
    console.error('Error reproduciendo timbre:', error);
    reproducirTimbreAlternativo();
  }
};

// Función alternativa usando Oscillator Web Audio API más simple
const reproducirTimbreAlternativo = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const tempo = 0.1; // 100ms por nota
    
    // Crear sonido rápido
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.value = 1400; // Frecuencia más alta
      gain.gain.setValueAtTime(0.5, ctx.currentTime + i * tempo);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * tempo + tempo * 0.8);
      
      osc.start(ctx.currentTime + i * tempo);
      osc.stop(ctx.currentTime + i * tempo + tempo * 0.8);
    }
  } catch (error) {
    console.error('Error en timbre alternativo:', error);
  }
};

// Reproducir notificación cuando hay pedidos listos
export const reproducirNotificacionPedidosListos = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const audioContext = new AudioContext();
    const ahora = audioContext.currentTime;
    
    // Dos pitidos de frecuencias diferentes (más musical)
    const reproducirNota = (startTime, frecuencia, duracion) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.frequency.value = frecuencia;
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duracion);
      
      osc.start(startTime);
      osc.stop(startTime + duracion);
    };
    
    // Dos notas diferentes para sonar más distintivo
    reproducirNota(ahora, 1000, 0.15); // La
    reproducirNota(ahora + 0.2, 1300, 0.2); // Si más agudo
    
  } catch (error) {
    console.error('Error reproduciendo notificación:', error);
  }
};


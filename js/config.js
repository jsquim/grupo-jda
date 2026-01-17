// ============================================
// CONFIG.JS - Configuración Simple
// ============================================

const CONFIG = {
  // SUPABASE - EDITAR CON TUS CREDENCIALES
  supabaseUrl: 'https://aoogaytjhsgonzctprhx.supabase.co',
  supabaseKey: 'keyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvb2dheXRqaHNnb256Y3Rwcmh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MTA1NjgsImV4cCI6MjA4NDA4NjU2OH0.NYTQJKEkjHVazLOyEVop84jh1pchoq_vwfZkyxbY6Foey',
  
  // Parámetros de préstamos
  tasaAnual: 0.10,
  tasaMensual: 0.10 / 12,
  montoMin: 100,
  montoMax: 4000,
  plazoMin: 1,
  plazoMax: 36,
  diasPrimeraCuota: 45
};

console.log('✅ Configuración cargada');

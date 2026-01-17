// ============================================
// SUPABASE-CLIENT.JS - Cliente de Supabase
// ============================================

class SupabaseClient {
  constructor() {
    this.client = null;
    this.inicializado = false;
  }
  
  /**
   * Inicializar cliente de Supabase
   */
  inicializar() {
    try {
      // Verificar que el SDK esté cargado
      if (typeof window.supabase === 'undefined') {
        throw new Error('SDK de Supabase no está cargado');
      }
      
      // Verificar configuración
      if (!APP_CONFIG.supabase.url || APP_CONFIG.supabase.url.includes('tu-proyecto')) {
        console.warn('⚠️ Debes configurar las credenciales de Supabase en config.js');
        return false;
      }
      
      // Crear cliente
      this.client = window.supabase.createClient(
        APP_CONFIG.supabase.url,
        APP_CONFIG.supabase.anonKey
      );
      
      this.inicializado = true;
      console.log('✅ Cliente Supabase inicializado');
      return true;
      
    } catch (error) {
      console.error('❌ Error al inicializar Supabase:', error);
      this.inicializado = false;
      return false;
    }
  }
  
  /**
   * Verificar si está inicializado
   */
  verificar() {
    if (!this.inicializado || !this.client) {
      throw new Error('Supabase no está inicializado');
    }
  }
  
  /**
   * Obtener cliente
   */
  obtenerCliente() {
    this.verificar();
    return this.client;
  }
  
  /**
   * Probar conexión
   */
  async probarConexion() {
    try {
      this.verificar();
      
      const { count, error } = await this.client
        .from('socios')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      
      console.log(`✅ Conexión exitosa - ${count} socios encontrados`);
      return { success: true, count };
      
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      return { success: false, error: error.message };
    }
  }
}

// Crear instancia global
const supabaseClient = new SupabaseClient();

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    supabaseClient.inicializar();
  });
} else {
  supabaseClient.inicializar();
}

// Exportar
window.supabaseClient = supabaseClient;

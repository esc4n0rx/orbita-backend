// models/nivelModel.js
const supabase = require('../config/database');

class NivelModel {
  static TABELA = 'orbita_niveis';

  static async buscarPontosPorNivel(nivel) {
    const { data, error } = await supabase
      .from(this.TABELA)
      .select('pontos_necessarios')
      .eq('nivel', nivel)
      .single();

    if (error) {
      console.error('Erro ao buscar pontos para o nível:', error);
      return null;
    }

    return data;
  }

  static async listarTodosNiveis() {
    const { data, error } = await supabase
      .from(this.TABELA)
      .select('*')
      .order('nivel', { ascending: true });

    if (error) {
      console.error('Erro ao listar níveis:', error);
      throw new Error(error.message);
    }

    return data;
  }
}

module.exports = NivelModel;
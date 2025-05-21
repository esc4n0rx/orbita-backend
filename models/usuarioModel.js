// Modelo de usuário 
const supabase = require('../config/database');

class UsuarioModel {
  static TABELA = 'orbita_usuarios';

  static async buscarPorEmail(email) {
    const { data, error } = await supabase
      .from(this.TABELA)
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Erro ao buscar usuário por email:', error);
      return null;
    }

    return data;
  }

  static async buscarPorId(id) {
    const { data, error } = await supabase
      .from(this.TABELA)
      .select('id, nome, email, nivel, pontos_xp, sequencia, criado_em')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar usuário por id:', error);
      return null;
    }

    return data;
  }

  static async criar(usuario) {
    const { data, error } = await supabase
      .from(this.TABELA)
      .insert([usuario])
      .select('id, nome, email, nivel, pontos_xp, sequencia, criado_em');

    if (error) {
      console.error('Erro ao criar usuário:', error);
      throw new Error(error.message);
    }

    return data[0];
  }
  static async atualizarPontosESequencia(id, pontos, sequencia) {
    const { data, error } = await supabase
      .from(this.TABELA)
      .update({
        pontos_xp: pontos,
        sequencia: sequencia
      })
      .eq('id', id)
      .select('id, nome, email, nivel, pontos_xp, sequencia, criado_em');

    if (error) {
      console.error('Erro ao atualizar pontos e sequência:', error);
      throw new Error(error.message);
    }

    return data[0];
  }

  static async atualizarNivel(id, novoNivel, pontos) {
    const { data, error } = await supabase
      .from(this.TABELA)
      .update({
        nivel: novoNivel,
        pontos_xp: pontos
      })
      .eq('id', id)
      .select('id, nome, email, nivel, pontos_xp, sequencia, criado_em');

    if (error) {
      console.error('Erro ao atualizar nível:', error);
      throw new Error(error.message);
    }

    return data[0];
  }
  
}


  

  

module.exports = UsuarioModel;
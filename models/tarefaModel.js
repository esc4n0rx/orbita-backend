// models/tarefaModel.js
const supabase = require('../config/database');

class TarefaModel {
  static TABELA = 'orbita_tarefas';

  static async criarTarefa(tarefa) {
    const { data, error } = await supabase
      .from(this.TABELA)
      .insert([tarefa])
      .select('*');

    if (error) {
      console.error('Erro ao criar tarefa:', error);
      throw new Error(error.message);
    }

    return data[0];
  }

  static async listarTarefasPorUsuario(usuarioId) {
    const { data, error } = await supabase
      .from(this.TABELA)
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('data_vencimento', { ascending: true });

    if (error) {
      console.error('Erro ao listar tarefas:', error);
      throw new Error(error.message);
    }

    return data;
  }

  static async buscarTarefaPorId(id) {
    const { data, error } = await supabase
      .from(this.TABELA)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar tarefa por id:', error);
      return null;
    }

    return data;
  }

  static async atualizarTarefa(id, atualizacoes) {
    const { data, error } = await supabase
      .from(this.TABELA)
      .update(atualizacoes)
      .eq('id', id)
      .select('*');

    if (error) {
      console.error('Erro ao atualizar tarefa:', error);
      throw new Error(error.message);
    }

    return data[0];
  }

    static async concluirTarefa(id) {
    const { data, error } = await supabase
        .from(this.TABELA)
        .update({
        concluida: true,
        data_conclusao: new Date().toISOString() // Usar formato ISO
        })
        .eq('id', id)
        .select('*');

    if (error) {
        console.error('Erro ao concluir tarefa:', error);
        throw new Error(error.message);
    }

    return data[0];
    }

  static async excluirTarefa(id) {
    const { error } = await supabase
      .from(this.TABELA)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir tarefa:', error);
      throw new Error(error.message);
    }

    return true;
  }

  static async contarTarefasConsecutivas(usuarioId) {
    // Esta consulta é mais complexa e exigiria uma customização no Supabase
    // Aqui, vamos retornar as tarefas concluídas ordenadas por data_conclusao
    // para realizar a lógica de "streak" (sequência) no service
    const { data, error } = await supabase
      .from(this.TABELA)
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('concluida', true)
      .order('data_conclusao', { ascending: false });

    if (error) {
      console.error('Erro ao contar tarefas consecutivas:', error);
      throw new Error(error.message);
    }

    return data;
  }

  static async listarTarefasVencidas() {
  const dataAtual = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
  
  const { data, error } = await supabase
    .from(this.TABELA)
    .select('*')
    .lt('data_vencimento', dataAtual)
    .eq('concluida', false);

  if (error) {
    console.error('Erro ao listar tarefas vencidas:', error);
    throw new Error(error.message);
  }

  return data;
}

static async marcarComoVencida(id) {
  const { data, error } = await supabase
    .from(this.TABELA)
    .update({
      concluida: true,
      vencida: true,
      data_conclusao: new Date().toISOString()
    })
    .eq('id', id)
    .select('*');

  if (error) {
    console.error('Erro ao marcar tarefa como vencida:', error);
    throw new Error(error.message);
  }

  return data[0];
}
}

module.exports = TarefaModel;
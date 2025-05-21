// models/tagModel.js
const supabase = require('../config/database');

class TagModel {
  static TABELA = 'orbita_tags';
  static TABELA_USUARIO_TAG = 'orbita_usuario_tags';
  static TABELA_TAREFA_TAG = 'orbita_tarefa_tags';

  // Buscar todas as tags padrão
  static async listarTagsPadrao() {
    const { data, error } = await supabase
      .from(this.TABELA)
      .select('*')
      .eq('padrao', true)
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao listar tags padrão:', error);
      throw new Error(error.message);
    }

    return data;
  }

  // Buscar tag pelo ID
  static async buscarPorId(id) {
    const { data, error } = await supabase
      .from(this.TABELA)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar tag por id:', error);
      return null;
    }

    return data;
  }

  // Buscar tags de um usuário (padrão + personalizadas)
  static async listarTagsUsuario(usuarioId) {
    // Primeiro busca as tags padrão
    const { data: tagsPadrao, error: errorPadrao } = await supabase
      .from(this.TABELA)
      .select('*')
      .eq('padrao', true)
      .order('nome', { ascending: true });

    if (errorPadrao) {
      console.error('Erro ao listar tags padrão:', errorPadrao);
      throw new Error(errorPadrao.message);
    }

    // Busca as tags personalizadas do usuário
    const { data: tagsPersonalizadas, error: errorPersonalizadas } = await supabase
      .from(this.TABELA_USUARIO_TAG)
      .select(`
        id,
        usuario_id,
        tag:tag_id (
          id,
          nome,
          cor,
          padrao
        )
      `)
      .eq('usuario_id', usuarioId);

    if (errorPersonalizadas) {
      console.error('Erro ao listar tags personalizadas:', errorPersonalizadas);
      throw new Error(errorPersonalizadas.message);
    }

    // Formatar tags personalizadas
    const tagsFormatadas = tagsPersonalizadas.map(item => ({
      id: item.tag.id,
      nome: item.tag.nome,
      cor: item.tag.cor,
      padrao: item.tag.padrao
    }));

    // Combinar ambas as listas e retornar
    return [...tagsPadrao, ...tagsFormatadas];
  }

  // Criar nova tag
  static async criarTag(tag) {
    const { data, error } = await supabase
      .from(this.TABELA)
      .insert([{
        nome: tag.nome,
        cor: tag.cor || '#000000',
        padrao: false // Tags criadas pelo usuário nunca são padrão
      }])
      .select('*');

    if (error) {
      console.error('Erro ao criar tag:', error);
      throw new Error(error.message);
    }

    return data[0];
  }

  // Associar tag a um usuário
  static async associarTagUsuario(usuarioId, tagId) {
    const { data, error } = await supabase
      .from(this.TABELA_USUARIO_TAG)
      .insert([{
        usuario_id: usuarioId,
        tag_id: tagId
      }])
      .select('*');

    if (error) {
      console.error('Erro ao associar tag ao usuário:', error);
      throw new Error(error.message);
    }

    return data[0];
  }

  // Associar tag a uma tarefa
  static async associarTagTarefa(tarefaId, tagId) {
    const { data, error } = await supabase
      .from(this.TABELA_TAREFA_TAG)
      .insert([{
        tarefa_id: tarefaId,
        tag_id: tagId
      }])
      .select('*');

    if (error) {
      console.error('Erro ao associar tag à tarefa:', error);
      throw new Error(error.message);
    }

    return data[0];
  }

  // Remover associação de tag com tarefa
  static async removerTagTarefa(tarefaId, tagId) {
    const { error } = await supabase
      .from(this.TABELA_TAREFA_TAG)
      .delete()
      .eq('tarefa_id', tarefaId)
      .eq('tag_id', tagId);

    if (error) {
      console.error('Erro ao remover tag da tarefa:', error);
      throw new Error(error.message);
    }

    return true;
  }

  // Listar tags de uma tarefa
  static async listarTagsTarefa(tarefaId) {
    const { data, error } = await supabase
      .from(this.TABELA_TAREFA_TAG)
      .select(`
        tag:tag_id (
          id,
          nome,
          cor,
          padrao
        )
      `)
      .eq('tarefa_id', tarefaId);

    if (error) {
      console.error('Erro ao listar tags da tarefa:', error);
      throw new Error(error.message);
    }

    // Formatar o resultado
    return data.map(item => item.tag);
  }

  // Atualizar tag personalizada
  static async atualizarTag(id, atualizacoes) {
    const { data, error } = await supabase
      .from(this.TABELA)
      .update(atualizacoes)
      .eq('id', id)
      .eq('padrao', false) // Só permite atualizar tags não padrão
      .select('*');

    if (error) {
      console.error('Erro ao atualizar tag:', error);
      throw new Error(error.message);
    }

    return data[0];
  }

  // Excluir tag personalizada
  static async excluirTag(id) {
    // Verificar se é uma tag padrão
    const { data: tag } = await supabase
      .from(this.TABELA)
      .select('padrao')
      .eq('id', id)
      .single();

    if (tag && tag.padrao) {
      throw new Error('Não é possível excluir uma tag padrão');
    }

    // Remover associações com tarefas
    const { error: errorTarefas } = await supabase
      .from(this.TABELA_TAREFA_TAG)
      .delete()
      .eq('tag_id', id);

    if (errorTarefas) {
      console.error('Erro ao remover associações de tarefa:', errorTarefas);
      throw new Error(errorTarefas.message);
    }

    // Remover associações com usuários
    const { error: errorUsuarios } = await supabase
      .from(this.TABELA_USUARIO_TAG)
      .delete()
      .eq('tag_id', id);

    if (errorUsuarios) {
      console.error('Erro ao remover associações de usuário:', errorUsuarios);
      throw new Error(errorUsuarios.message);
    }

    // Excluir a tag
    const { error } = await supabase
      .from(this.TABELA)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir tag:', error);
      throw new Error(error.message);
    }

    return true;
  }
}

module.exports = TagModel;
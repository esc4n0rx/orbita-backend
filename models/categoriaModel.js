// models/categoriaModel.js
const supabase = require('../config/database');

class CategoriaModel {
  static TABELA = 'orbita_categorias';
  static TABELA_USUARIO_CATEGORIA = 'orbita_usuario_categorias';
  static TABELA_TAREFA_CATEGORIA = 'orbita_tarefa_categorias';

  // Buscar todas as categorias padrão
  static async listarCategoriasPadrao() {
    const { data, error } = await supabase
      .from(this.TABELA)
      .select('*')
      .eq('padrao', true)
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao listar categorias padrão:', error);
      throw new Error(error.message);
    }

    return data;
  }

  // Buscar categoria pelo ID
  static async buscarPorId(id) {
    const { data, error } = await supabase
      .from(this.TABELA)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar categoria por id:', error);
      return null;
    }

    return data;
  }

  // Buscar categorias de um usuário (padrão + personalizadas)
  static async listarCategoriasUsuario(usuarioId) {
    // Primeiro busca as categorias padrão
    const { data: categoriasPadrao, error: errorPadrao } = await supabase
      .from(this.TABELA)
      .select('*')
      .eq('padrao', true)
      .order('nome', { ascending: true });

    if (errorPadrao) {
      console.error('Erro ao listar categorias padrão:', errorPadrao);
      throw new Error(errorPadrao.message);
    }

    // Busca as categorias personalizadas do usuário
    const { data: categoriasPersonalizadas, error: errorPersonalizadas } = await supabase
      .from(this.TABELA_USUARIO_CATEGORIA)
      .select(`
        id,
        usuario_id,
        categoria:categoria_id (
          id,
          nome,
          cor,
          icone,
          padrao
        )
      `)
      .eq('usuario_id', usuarioId);

    if (errorPersonalizadas) {
      console.error('Erro ao listar categorias personalizadas:', errorPersonalizadas);
      throw new Error(errorPersonalizadas.message);
    }

    // Formatar categorias personalizadas
    const categoriasFormatadas = categoriasPersonalizadas.map(item => ({
      id: item.categoria.id,
      nome: item.categoria.nome,
      cor: item.categoria.cor,
      icone: item.categoria.icone,
      padrao: item.categoria.padrao
    }));

    // Combinar ambas as listas e retornar
    return [...categoriasPadrao, ...categoriasFormatadas];
  }

  // Criar nova categoria
  static async criarCategoria(categoria) {
    const { data, error } = await supabase
      .from(this.TABELA)
      .insert([{
        nome: categoria.nome,
        cor: categoria.cor || '#000000',
        icone: categoria.icone || 'default',
        padrao: false // Categorias criadas pelo usuário nunca são padrão
      }])
      .select('*');

    if (error) {
      console.error('Erro ao criar categoria:', error);
      throw new Error(error.message);
    }

    return data[0];
  }

  // Associar categoria a um usuário
  static async associarCategoriaUsuario(usuarioId, categoriaId) {
    const { data, error } = await supabase
      .from(this.TABELA_USUARIO_CATEGORIA)
      .insert([{
        usuario_id: usuarioId,
        categoria_id: categoriaId
      }])
      .select('*');

    if (error) {
      console.error('Erro ao associar categoria ao usuário:', error);
      throw new Error(error.message);
    }

    return data[0];
  }

  // Associar categoria a uma tarefa
  static async associarCategoriaTarefa(tarefaId, categoriaId) {
    const { data, error } = await supabase
      .from(this.TABELA_TAREFA_CATEGORIA)
      .insert([{
        tarefa_id: tarefaId,
        categoria_id: categoriaId
      }])
      .select('*');

    if (error) {
      console.error('Erro ao associar categoria à tarefa:', error);
      throw new Error(error.message);
    }

    return data[0];
  }

  // Remover associação de categoria com tarefa
  static async removerCategoriaTarefa(tarefaId, categoriaId) {
    const { error } = await supabase
      .from(this.TABELA_TAREFA_CATEGORIA)
      .delete()
      .eq('tarefa_id', tarefaId)
      .eq('categoria_id', categoriaId);

    if (error) {
      console.error('Erro ao remover categoria da tarefa:', error);
      throw new Error(error.message);
    }

    return true;
  }

  // Listar categorias de uma tarefa
  static async listarCategoriasTarefa(tarefaId) {
    const { data, error } = await supabase
      .from(this.TABELA_TAREFA_CATEGORIA)
      .select(`
        categoria:categoria_id (
          id,
          nome,
          cor,
          icone,
          padrao
        )
      `)
      .eq('tarefa_id', tarefaId);

    if (error) {
      console.error('Erro ao listar categorias da tarefa:', error);
      throw new Error(error.message);
    }

    // Formatar o resultado
    return data.map(item => item.categoria);
  }

  // Atualizar categoria personalizada
  static async atualizarCategoria(id, atualizacoes) {
    const { data, error } = await supabase
      .from(this.TABELA)
      .update(atualizacoes)
      .eq('id', id)
      .eq('padrao', false) // Só permite atualizar categorias não padrão
      .select('*');

    if (error) {
      console.error('Erro ao atualizar categoria:', error);
      throw new Error(error.message);
    }

    return data[0];
  }

  // Excluir categoria personalizada
  static async excluirCategoria(id) {
    // Verificar se é uma categoria padrão
    const { data: categoria } = await supabase
      .from(this.TABELA)
      .select('padrao')
      .eq('id', id)
      .single();

    if (categoria && categoria.padrao) {
      throw new Error('Não é possível excluir uma categoria padrão');
    }

    // Remover associações com tarefas
    const { error: errorTarefas } = await supabase
      .from(this.TABELA_TAREFA_CATEGORIA)
      .delete()
      .eq('categoria_id', id);

    if (errorTarefas) {
      console.error('Erro ao remover associações de tarefa:', errorTarefas);
      throw new Error(errorTarefas.message);
    }

    // Remover associações com usuários
    const { error: errorUsuarios } = await supabase
      .from(this.TABELA_USUARIO_CATEGORIA)
      .delete()
      .eq('categoria_id', id);

    if (errorUsuarios) {
      console.error('Erro ao remover associações de usuário:', errorUsuarios);
      throw new Error(errorUsuarios.message);
    }

    // Excluir a categoria
    const { error } = await supabase
      .from(this.TABELA)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir categoria:', error);
      throw new Error(error.message);
    }

    return true;
  }
}

module.exports = CategoriaModel;
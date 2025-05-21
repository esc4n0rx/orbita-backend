// services/categoriaService.js
const CategoriaModel = require('../models/categoriaModel');

class CategoriaService {
  // Listar todas as categorias padrão
  static async listarCategoriasPadrao() {
    return await CategoriaModel.listarCategoriasPadrao();
  }

  // Listar todas as categorias de um usuário (padrão + personalizadas)
  static async listarCategoriasUsuario(usuarioId) {
    return await CategoriaModel.listarCategoriasUsuario(usuarioId);
  }

  // Criar nova categoria personalizada
  static async criarCategoria(usuarioId, dadosCategoria) {
    // Criar a categoria
    const novaCategoria = await CategoriaModel.criarCategoria(dadosCategoria);
    
    // Associar ao usuário
    await CategoriaModel.associarCategoriaUsuario(usuarioId, novaCategoria.id);
    
    return novaCategoria;
  }

  // Atualizar categoria personalizada
  static async atualizarCategoria(categoriaId, usuarioId, dadosCategoria) {
    // Verificar se a categoria existe
    const categoria = await CategoriaModel.buscarPorId(categoriaId);
    if (!categoria) {
      throw new Error('Categoria não encontrada');
    }
    
    // Verificar se é uma categoria padrão
    if (categoria.padrao) {
      throw new Error('Não é possível atualizar uma categoria padrão');
    }
    
    // Verificar se pertence ao usuário (implementação simplificada)
    const categoriasUsuario = await CategoriaModel.listarCategoriasUsuario(usuarioId);
    const categoriaDoUsuario = categoriasUsuario.find(cat => cat.id === categoriaId);
    
    if (!categoriaDoUsuario) {
      throw new Error('Categoria não pertence ao usuário');
    }
    
    // Atualizar categoria
    return await CategoriaModel.atualizarCategoria(categoriaId, dadosCategoria);
  }

  // Excluir categoria personalizada
  static async excluirCategoria(categoriaId, usuarioId) {
    // Verificar se a categoria existe
    const categoria = await CategoriaModel.buscarPorId(categoriaId);
    if (!categoria) {
      throw new Error('Categoria não encontrada');
    }
    
    // Verificar se é uma categoria padrão
    if (categoria.padrao) {
      throw new Error('Não é possível excluir uma categoria padrão');
    }
    
    // Verificar se pertence ao usuário (implementação simplificada)
    const categoriasUsuario = await CategoriaModel.listarCategoriasUsuario(usuarioId);
    const categoriaDoUsuario = categoriasUsuario.find(cat => cat.id === categoriaId);
    
    if (!categoriaDoUsuario) {
      throw new Error('Categoria não pertence ao usuário');
    }
    
    // Excluir categoria
    return await CategoriaModel.excluirCategoria(categoriaId);
  }

  // Associar categoria a uma tarefa
  static async associarCategoriaTarefa(tarefaId, categoriaId) {
    return await CategoriaModel.associarCategoriaTarefa(tarefaId, categoriaId);
  }

  // Remover categoria de uma tarefa
  static async removerCategoriaTarefa(tarefaId, categoriaId) {
    return await CategoriaModel.removerCategoriaTarefa(tarefaId, categoriaId);
  }

  // Listar categorias de uma tarefa
  static async listarCategoriasTarefa(tarefaId) {
    return await CategoriaModel.listarCategoriasTarefa(tarefaId);
  }
}

module.exports = CategoriaService;
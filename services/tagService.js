// services/tagService.js
const TagModel = require('../models/tagModel');

class TagService {
  // Listar todas as tags padrão
  static async listarTagsPadrao() {
    return await TagModel.listarTagsPadrao();
  }

  // Listar todas as tags de um usuário (padrão + personalizadas)
  static async listarTagsUsuario(usuarioId) {
    return await TagModel.listarTagsUsuario(usuarioId);
  }

  // Criar nova tag personalizada
  static async criarTag(usuarioId, dadosTag) {
    // Criar a tag
    const novaTag = await TagModel.criarTag(dadosTag);
    
    // Associar ao usuário
    await TagModel.associarTagUsuario(usuarioId, novaTag.id);
    
    return novaTag;
  }

  // Atualizar tag personalizada
  static async atualizarTag(tagId, usuarioId, dadosTag) {
    // Verificar se a tag existe
    const tag = await TagModel.buscarPorId(tagId);
    if (!tag) {
      throw new Error('Tag não encontrada');
    }
    
    // Verificar se é uma tag padrão
    if (tag.padrao) {
      throw new Error('Não é possível atualizar uma tag padrão');
    }
    
    // Verificar se pertence ao usuário (implementação simplificada)
    const tagsUsuario = await TagModel.listarTagsUsuario(usuarioId);
    const tagDoUsuario = tagsUsuario.find(t => t.id === tagId);
    
    if (!tagDoUsuario) {
      throw new Error('Tag não pertence ao usuário');
    }
    
    // Atualizar tag
    return await TagModel.atualizarTag(tagId, dadosTag);
  }

  // Excluir tag personalizada
  static async excluirTag(tagId, usuarioId) {
    // Verificar se a tag existe
    const tag = await TagModel.buscarPorId(tagId);
    if (!tag) {
      throw new Error('Tag não encontrada');
    }
    
    // Verificar se é uma tag padrão
    if (tag.padrao) {
      throw new Error('Não é possível excluir uma tag padrão');
    }
    
    // Verificar se pertence ao usuário (implementação simplificada)
    const tagsUsuario = await TagModel.listarTagsUsuario(usuarioId);
    const tagDoUsuario = tagsUsuario.find(t => t.id === tagId);
    
    if (!tagDoUsuario) {
      throw new Error('Tag não pertence ao usuário');
    }
    
    // Excluir tag
    return await TagModel.excluirTag(tagId);
  }

  // Associar tag a uma tarefa
  static async associarTagTarefa(tarefaId, tagId) {
    return await TagModel.associarTagTarefa(tarefaId, tagId);
  }

  // Remover tag de uma tarefa
  static async removerTagTarefa(tarefaId, tagId) {
    return await TagModel.removerTagTarefa(tarefaId, tagId);
  }

  // Listar tags de uma tarefa
  static async listarTagsTarefa(tarefaId) {
    return await TagModel.listarTagsTarefa(tarefaId);
  }
}

module.exports = TagService;
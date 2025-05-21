// Serviço de usuário 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/usuarioModel');
require('dotenv').config();

class UsuarioService {
  static async registrar(dadosUsuario) {
    // Verificar se o usuário já existe
    const usuarioExistente = await UsuarioModel.buscarPorEmail(dadosUsuario.email);
    if (usuarioExistente) {
      throw new Error('Email já está em uso');
    }

    // Hash da senha
    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(dadosUsuario.senha, saltRounds);

    // Preparar dados para inserção
    const novoUsuario = {
      nome: dadosUsuario.nome,
      email: dadosUsuario.email,
      senha_hash: senhaHash,
      nivel: 1,
      pontos_xp: 0,
      sequencia: 0
    };

    // Salvar no banco de dados
    const usuarioCriado = await UsuarioModel.criar(novoUsuario);
    return usuarioCriado;
  }

  static async login(email, senha) {
    // Buscar usuário pelo email
    const usuario = await UsuarioModel.buscarPorEmail(email);
    if (!usuario) {
      throw new Error('Credenciais inválidas');
    }

    // Verificar senha
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaCorreta) {
      throw new Error('Credenciais inválidas');
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Retornar dados do usuário e token (sem senha)
    const { senha_hash, ...usuarioSemSenha } = usuario;
    return {
      usuario: usuarioSemSenha,
      token
    };
  }

  static async validarToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const usuario = await UsuarioModel.buscarPorId(decoded.id);
      
      if (!usuario) {
        throw new Error('Usuário não encontrado');
      }
      
      return usuario;
    } catch (error) {
      throw new Error('Token inválido');
    }
  }
}

module.exports = UsuarioService;
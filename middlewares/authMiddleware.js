// Middleware de autenticação 
const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/usuarioModel');
require('dotenv').config();

const authMiddleware = async (req, res, next) => {
  try {
    // Verificar se o token foi enviado
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        erro: true, 
        mensagem: 'Token não fornecido' 
      });
    }

    // Extrair o token
    const token = authHeader.split(' ')[1];
    
    // Verificar a validade do token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar informações do usuário
    const usuario = await UsuarioModel.buscarPorId(decoded.id);
    if (!usuario) {
      return res.status(401).json({ 
        erro: true, 
        mensagem: 'Usuário não encontrado' 
      });
    }
    
    // Adicionar informações do usuário ao objeto req
    req.usuario = usuario;
    req.token = token;
    
    // Prosseguir para o próximo middleware ou controlador
    next();
  } catch (error) {
    console.error('Erro ao validar token:', error);
    return res.status(401).json({ 
      erro: true, 
      mensagem: 'Token inválido' 
    });
  }
};

module.exports = authMiddleware;
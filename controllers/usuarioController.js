// Controlador de usuário 
const UsuarioService = require('../services/usuarioService');
const { registroSchema, loginSchema } = require('../utils/validadores');

class UsuarioController {
  static async registrar(req, res) {
    try {
      // Validar dados de entrada
      const resultado = registroSchema.safeParse(req.body);
      if (!resultado.success) {
        return res.status(400).json({ 
          erro: true, 
          mensagem: 'Dados inválidos', 
          detalhes: resultado.error.issues 
        });
      }

      // Processar registro
      const usuario = await UsuarioService.registrar(resultado.data);
      
      return res.status(201).json({
        erro: false,
        mensagem: 'Usuário registrado com sucesso',
        usuario
      });
    } catch (error) {
      if (error.message === 'Email já está em uso') {
        return res.status(409).json({ erro: true, mensagem: error.message });
      }
      
      console.error('Erro ao registrar usuário:', error);
      return res.status(500).json({ 
        erro: true, 
        mensagem: 'Erro interno do servidor' 
      });
    }
  }

  static async login(req, res) {
    try {
      // Validar dados de entrada
      const resultado = loginSchema.safeParse(req.body);
      if (!resultado.success) {
        return res.status(400).json({ 
          erro: true, 
          mensagem: 'Dados inválidos', 
          detalhes: resultado.error.issues 
        });
      }

      // Processar login
      const { email, senha } = resultado.data;
      const dadosLogin = await UsuarioService.login(email, senha);
      
      return res.status(200).json({
        erro: false,
        mensagem: 'Login realizado com sucesso',
        ...dadosLogin
      });
    } catch (error) {
      if (error.message === 'Credenciais inválidas') {
        return res.status(401).json({ erro: true, mensagem: error.message });
      }
      
      console.error('Erro ao fazer login:', error);
      return res.status(500).json({ 
        erro: true, 
        mensagem: 'Erro interno do servidor' 
      });
    }
  }

  static async validarToken(req, res) {
    try {
      // Token já foi validado pelo middleware
      return res.status(200).json({
        erro: false,
        mensagem: 'Token válido',
        usuario: req.usuario
      });
    } catch (error) {
      return res.status(401).json({ 
        erro: true, 
        mensagem: 'Token inválido' 
      });
    }
  }
}

module.exports = UsuarioController;
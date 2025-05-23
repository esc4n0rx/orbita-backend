// Arquivo principal do servidor 
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const usuarioRoutes = require('./routes/usuarioRoutes');
const tarefaRoutes = require('./routes/tarefaRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const tagRoutes = require('./routes/tagRoutes');
const neurolinkRoutes = require('./routes/neurolinkRoutes');
const pushNotificationRoutes = require('./routes/pushNotificationRoutes');
const NotificationScheduler = require('./neurolink/scheduler/NotificationScheduler');
const { swaggerUi, swaggerDocs } = require('./docs/swagger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Rotas
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/tarefas', tarefaRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/neurolink', neurolinkRoutes);
app.use('/api/push', pushNotificationRoutes);



const scheduler = new NotificationScheduler();
scheduler.start();


// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, parando scheduler...');
  scheduler.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT recebido, parando scheduler...');
  scheduler.stop();
  process.exit(0);
});

// Rota padrão
app.get('/', (req, res) => {
  res.json({ mensagem: 'API de Tarefas' });
});

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    erro: true,
    mensagem: 'Erro interno do servidor',
  });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({
    erro: true,
    mensagem: 'Rota não encontrada',
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;
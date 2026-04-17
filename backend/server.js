require('dotenv').config();

console.log("INICIANDO SERVIDOR...");

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

db.connect(err => {
    if (err) {
        console.log('Erro ao conectar:', err);
    } else {
        console.log('Conectado ao banco!');
    }
});

app.get('/', (req, res) => {
    res.send('Servidor funcionando!');
});

app.post('/cadastro', (req, res) => {

    const { nome, login, senha } = req.body;

    const checkSql = 'SELECT * FROM usuarios WHERE login = ?';

    db.query(checkSql, [login], (err, results) => {

        if(err) {
            console.log(err);
            return res.status(500).json({ erro: 'Erro ao verificar usuário' });
        }

        if (results.length > 0) {
            return res.status(400).json({ erro: 'Login já existe'});
        }
    
    const sql = 'INSERT INTO usuarios (nome, login, senha, atualizado_em, atualizado_por) VALUES (?, ?, ?, NOW(), 1)';

        db.query(sql, [nome, login, senha], (err, result) => {

        if (err) {
            console.log(err);
            return res.status(500).json({ erro: 'Erro ao cadastrar' });
        }

        res.json({ mensagem: 'Usuário cadastrado com sucesso!' });

         });

    })

});

app.post('/login', (req, res) => {

    const { login, senha } = req.body;

    const sql = 'SELECT * FROM usuarios WHERE login = ?';

    db.query(sql, [login], (err, results) => {

        if (err) {
            console.log(err);
            return res.status(500).json({ erro: 'Erro no servidor' });
        }

        if (results.length === 0) {
            return res.status(401).json({ erro: 'Usuário não encontrado' });
        }

        const usuario = results[0];

        if (usuario.senha !== senha) {
            return res.status(401).json({ erro: 'Senha incorreta' });
        }

        res.json({
            mensagem: 'Login realizado com sucesso!',
            usuario: {
                id: usuario.usuario_id,
                nome: usuario.nome
            }
         });

    });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('Servidor rodando na porta', PORT);
});

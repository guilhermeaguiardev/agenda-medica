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
        console.log('ERRO BANCO:', err);
    } else {
        console.log('BANCO CONECTADO');
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

        if (!results || results.length === 0) {
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

app.get('/usuarios', (req, res) => {

    const sql = 'SELECT id, nome, login FROM usuarios';

    db.query(sql, (err, results) => {

        if (err) {
            return res.status(500).json({ erro: 'Erro ao buscar usuários' });
        }

        res.json(results);

    });

});

// =========================
// BUSCAR POR ID
// =========================
app.get('/usuarios/:id', (req, res) => {

    const { id } = req.params;

    const sql = 'SELECT id, nome, login FROM usuarios WHERE id = ?';

    db.query(sql, [id], (err, results) => {

        if (err) {
            return res.status(500).json({ erro: 'Erro ao buscar usuário' });
        }

        if (results.length === 0) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }

        res.json(results[0]);

    });

});

// =========================
//  ATUALIZAR
// =========================
app.put('/usuarios/:id', (req, res) => {

    const { id } = req.params;
    const { nome, login, senha } = req.body;

    let sql;
    let params;

    if (senha) {
        sql = `
            UPDATE usuarios 
            SET nome = ?, login = ?, senha = ?, atualizado_em = NOW(), atualizado_por = 1 
            WHERE id = ?
        `;
        params = [nome, login, senha, id];
    } else {
        sql = `
            UPDATE usuarios 
            SET nome = ?, login = ?, atualizado_em = NOW(), atualizado_por = 1 
            WHERE id = ?
        `;
        params = [nome, login, id];
    }

    db.query(sql, params, (err) => {

        if (err) {
            return res.status(500).json({ erro: 'Erro ao atualizar usuário' });
        }

        res.json({ mensagem: 'Usuário atualizado com sucesso!' });

    });

});

// =========================
// EXCLUIR
// =========================
app.delete('/usuarios/:id', (req, res) => {

    const { id } = req.params;

    const sql = 'DELETE FROM usuarios WHERE id = ?';

    db.query(sql, [id], (err) => {

        if (err) {
            return res.status(500).json({ erro: 'Erro ao excluir usuário' });
        }

        res.json({ mensagem: 'Usuário excluído com sucesso!' });

    });

});

const PORT = process.env.PORT || 3000;

app.use((err, req, res, next) => {
    console.error("ERRO GLOBAL:", err);
    return res.status(500).json({ erro: err.message });
});

app.listen(PORT, () => {
    console.log('Servidor rodando na porta', PORT);
});

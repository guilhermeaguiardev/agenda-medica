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

    const sql = 'SELECT usuario_id AS id, nome, login FROM usuarios';

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

    const sql = 'SELECT usuario_id AS id, nome, login FROM usuarios WHERE usuario_id = ?';

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
            WHERE usuario_id = ?
        `;
        params = [nome, login, senha, id];
    } else {
        sql = `
            UPDATE usuarios 
            SET nome = ?, login = ?, atualizado_em = NOW(), atualizado_por = 1 
            WHERE usuario_id = ?
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

    const sql = 'DELETE FROM usuarios WHERE usuario_id = ?';

    db.query(sql, [id], (err) => {

        if (err) {
            return res.status(500).json({ erro: 'Erro ao excluir usuário' });
        }

        res.json({ mensagem: 'Usuário excluído com sucesso!' });

    });

});

// =========================
// LISTAR CLIENTES
// =========================
app.get('/clientes', (req, res) => {

    const sql = `
        SELECT pessoa_id AS id, nome, cpf, nascimento, telefone
        FROM pessoas
        WHERE pessoa_tipo = 'cliente'
        ORDER BY pessoa_id
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.log(err);
            return res.status(500).json({ erro: 'Erro ao buscar clientes' });
        }

        res.json(results);

    });

});

// =========================
// BUSCAR CLIENTE POR ID
// =========================
app.get('/clientes/:id', (req, res) => {

    const { id } = req.params;

    const sql = `
        SELECT pessoa_id AS id, nome, cpf, nascimento, telefone
        FROM pessoas
        WHERE pessoa_id = ? AND pessoa_tipo = 'cliente'
    `;

    db.query(sql, [id], (err, results) => {

        if (err) {
            return res.status(500).json({ erro: 'Erro ao buscar cliente' });
        }

        if (results.length === 0) {
            return res.status(404).json({ erro: 'Cliente não encontrado' });
        }

        res.json(results[0]);

    });

});

// =========================
// CADASTRAR CLIENTE
// =========================
app.post('/clientes', (req, res) => {

    const { nome, cpf, nascimento, telefone } = req.body;

    const sql = `
        INSERT INTO pessoas (nome, cpf, nascimento, telefone, pessoa_tipo)
        VALUES (?, ?, ?, ?, 'cliente')
    `;

    db.query(sql, [nome, cpf, nascimento, telefone], (err) => {

        if (err) {
            console.log(err);
            return res.status(500).json({ erro: 'Erro ao cadastrar cliente' });
        }

        res.json({ mensagem: 'Cliente cadastrado com sucesso!' });

    });

});

// =========================
// ATUALIZAR CLIENTE
// =========================
app.put('/clientes/:id', (req, res) => {

    const { id } = req.params;
    const { nome, cpf, nascimento, telefone } = req.body;

    const sql = `
        UPDATE pessoas
        SET nome = ?, cpf = ?, nascimento = ?, telefone = ?
        WHERE pessoa_id = ? AND pessoa_tipo = 'cliente'
    `;

    db.query(sql, [nome, cpf, nascimento, telefone, id], (err) => {

        if (err) {
            return res.status(500).json({ erro: 'Erro ao atualizar cliente' });
        }

        res.json({ mensagem: 'Cliente atualizado com sucesso!' });

    });

});

// =========================
// EXCLUIR CLIENTE
// =========================
app.delete('/clientes/:id', (req, res) => {

    const { id } = req.params;

    const sql = `
        DELETE FROM pessoas
        WHERE pessoa_id = ? AND pessoa_tipo = 'cliente'
    `;

    db.query(sql, [id], (err) => {

        if (err) {
            return res.status(500).json({ erro: 'Erro ao excluir cliente' });
        }

        res.json({ mensagem: 'Cliente excluído com sucesso!' });

    });

});


// =========================
// LISTAR MEDICOS
// =========================
app.get('/medicos/:id', (req, res) => {

    const { id } = req.params;

    const sql = `
        SELECT pessoa_id AS id, nome, cpf, nascimento, telefone
        FROM pessoas
        WHERE pessoa_id = ? AND pessoa_tipo = 'medico'
    `;

    db.query(sql, [id], (err, results) => {

        if (err) {
            return res.status(500).json({ erro: 'Erro ao buscar médico' });
        }

        if (results.length === 0) {
            return res.status(404).json({ erro: 'Médico não encontrado' });
        }

        res.json(results[0]);

    });

});

// =========================
// BUSCAR MEDICO POR ID
// =========================
app.get('/medicos/:id', (req, res) => {

    const { id } = req.params;

    const sql = `
        SELECT pessoa_id AS id, nome, cpf, nascimento, telefone
        FROM pessoas
        WHERE pessoa_id = ? AND pessoa_tipo = 'medico'
    `;

    db.query(sql, [id], (err, results) => {

        if (err) {
            return res.status(500).json({ erro: 'Erro ao buscar médico' });
        }

        if (results.length === 0) {
            return res.status(404).json({ erro: 'Médico não encontrado' });
        }

        res.json(results[0]);

    });

});

// =========================
// CADASTRAR MEDICO
// =========================
app.post('/medicos', (req, res) => {

    const { nome, cpf, nascimento, telefone } = req.body;

    const sql = `
        INSERT INTO pessoas (nome, cpf, nascimento, telefone, pessoa_tipo)
        VALUES (?, ?, ?, ?, 'medico')
    `;

    db.query(sql, [nome, cpf, nascimento, telefone], (err) => {

        if (err) {
            return res.status(500).json({ erro: 'Erro ao cadastrar médico' });
        }

        res.json({ mensagem: 'Médico cadastrado com sucesso!' });

    });

});

// =========================
// ATUALIZAR MEDICO
// =========================
app.put('/medicos/:id', (req, res) => {

    const { id } = req.params;
    const { nome, cpf, nascimento, telefone } = req.body;

    const sql = `
        UPDATE pessoas
        SET nome = ?, cpf = ?, nascimento = ?, telefone = ?
        WHERE pessoa_id = ? AND pessoa_tipo = 'medico'
    `;

    db.query(sql, [nome, cpf, nascimento, telefone, id], (err) => {

        if (err) {
            return res.status(500).json({ erro: 'Erro ao atualizar médico' });
        }

        res.json({ mensagem: 'Médico atualizado com sucesso!' });

    });

});

// =========================
// EXCLUIR MEDICO
// =========================
app.delete('/medicos/:id', (req, res) => {

    const { id } = req.params;

    const sql = `
        DELETE FROM pessoas
        WHERE pessoa_id = ? AND pessoa_tipo = 'medico'
    `;

    db.query(sql, [id], (err) => {

        if (err) {
            return res.status(500).json({ erro: 'Erro ao excluir médico' });
        }

        res.json({ mensagem: 'Médico excluído com sucesso!' });

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

require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { sequelize, Usuario } = require('./models');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/auth', require('./routes/auth.routes'));
app.use('/libros', require('./routes/libros.routes'));
app.use('/prestamos', require('./routes/prestamos.routes'));
app.use('/usuarios', require('./routes/usuarios.routes'));

const puerto = process.env.PORT || 3000;

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const email = 'admin@biblioteca.com';
    if (!(await Usuario.findOne({ where: { email } }))) {
      await Usuario.create({
        nombre: 'Administrador', email,
        password: await bcrypt.hash('Admin123*', 10), rol: 'admin'
      });
    }
    app.listen(puerto, () =>
      console.log(`Servidor iniciado en http://localhost:${puerto}`));
  } catch (e) {
    console.error('No se pudo iniciar:', e.message);
  }
})();
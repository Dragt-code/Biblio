const r = require('express').Router();
const c = require('../controllers/usuarios.controller');
const { verificarToken, soloAdmin } = require('../middlewares/auth');
r.get('/', verificarToken, soloAdmin, c.listar);
r.put('/:id', verificarToken, soloAdmin, c.actualizar);
r.delete('/:id', verificarToken, soloAdmin, c.eliminar);
module.exports = r;
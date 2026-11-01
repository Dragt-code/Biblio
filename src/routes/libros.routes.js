const r = require('express').Router();
const c = require('../controllers/libros.controller');
const { verificarToken, soloAdmin } = require('../middlewares/auth');
r.get('/', verificarToken, c.listar);
r.post('/', verificarToken, soloAdmin, c.crear);
r.put('/:id', verificarToken, soloAdmin, c.actualizar);
r.delete('/:id', verificarToken, soloAdmin, c.eliminar);
module.exports = r;
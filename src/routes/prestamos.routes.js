const r = require('express').Router();
const c = require('../controllers/prestamos.controller');
const { verificarToken, soloAdmin } = require('../middlewares/auth');
r.post('/', verificarToken, c.solicitar);
r.get('/', verificarToken, c.listar);
r.put('/:id/aprobar', verificarToken, soloAdmin, c.aprobar);
r.put('/:id/devolver', verificarToken, soloAdmin, c.devolver);
module.exports = r;
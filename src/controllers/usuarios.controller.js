const { Usuario } = require('../models');

exports.listar = async (req, res) =>
  res.json(await Usuario.findAll({ attributes: ['id', 'nombre', 'email', 'rol'] }));

exports.actualizar = async (req, res) => {
  const { nombre, rol } = req.body;
  if (!nombre || !['admin', 'usuario'].includes(rol))
    return res.status(400).json({ mensaje: 'Nombre y rol válidos son obligatorios' });
  const u = await Usuario.findByPk(req.params.id);
  if (!u) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
  await u.update({ nombre: nombre.trim(), rol });
  res.json({ id: u.id, nombre: u.nombre, email: u.email, rol: u.rol });
};

exports.eliminar = async (req, res) => {
  if (Number(req.params.id) === req.user.id)
    return res.status(400).json({ mensaje: 'No puedes eliminar tu propia cuenta' });
  const u = await Usuario.findByPk(req.params.id);
  if (!u) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
  await u.destroy();
  res.json({ mensaje: 'Usuario eliminado' });
};
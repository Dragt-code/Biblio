const { Op } = require('sequelize');
const { Libro } = require('../models');

exports.listar = async (req, res) => {
  try {
    const titulo = String(req.query.titulo || '').trim();
    const where = titulo ? { titulo: { [Op.like]: `%${titulo}%` } } : {};
    res.json(await Libro.findAll({ where, order: [['titulo', 'ASC']] }));
  } catch {
    res.status(500).json({ mensaje: 'No se pudo cargar el catálogo' });
  }
};

exports.crear = async (req, res) => {
  try {
    res.status(201).json(await Libro.create(req.body));
  } catch (e) {
    res.status(400).json({ mensaje: e.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const libro = await Libro.findByPk(req.params.id);
    if (!libro) return res.status(404).json({ mensaje: 'Libro no encontrado' });
    await libro.update(req.body);
    res.json(libro);
  } catch (e) {
    res.status(400).json({ mensaje: e.message });
  }
};

exports.eliminar = async (req, res) => {
  const libro = await Libro.findByPk(req.params.id);
  if (!libro) return res.status(404).json({ mensaje: 'Libro no encontrado' });
  await libro.destroy();
  res.json({ mensaje: 'Libro eliminado' });
};
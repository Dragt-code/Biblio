const crypto = require('crypto');
const { Op } = require('sequelize');
const { sequelize, Prestamo, Libro, Usuario } = require('../models');

const generarCodigo = () => crypto.randomBytes(4).toString('hex').toUpperCase();

exports.solicitar = async (req, res) => {
  try {
    const libroId = Number(req.body.libro_id);
    if (!Number.isInteger(libroId) || libroId < 1)
      return res.status(400).json({ mensaje: 'Libro inválido' });
    const libro = await Libro.findByPk(libroId);
    if (!libro) return res.status(404).json({ mensaje: 'Libro no encontrado' });
    if (libro.cantidad < 1) return res.status(400).json({ mensaje: 'Sin stock disponible' });
    const solicitudActiva = await Prestamo.findOne({
      where: {
        usuario_id: req.user.id,
        libro_id: libro.id,
        estado: { [Op.in]: ['pendiente', 'prestado'] }
      }
    });
    if (solicitudActiva) return res.status(409).json({ mensaje: 'Ya tienes una solicitud pendiente para este libro' });

    const prestamo = await Prestamo.create({
      codigo: generarCodigo(),
      usuario_id: req.user.id,
      libro_id: libro.id,
      estado: 'pendiente'
    });
    res.status(201).json(prestamo);
  } catch (e) {
    res.status(500).json({ mensaje: e.message });
  }
};

exports.listar = async (req, res) => {
  const where = req.user.rol === 'admin' ? {} : { usuario_id: req.user.id };
  res.json(await Prestamo.findAll({
    where,
    include: [{ model: Libro, attributes: ['titulo', 'autor'] },
              { model: Usuario, attributes: ['nombre', 'email'] }],
    order: [['id', 'DESC']]
  }));
};

exports.aprobar = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const p = await Prestamo.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!p || p.estado !== 'pendiente') {
      await t.rollback();
      return res.status(400).json({ mensaje: 'Préstamo no válido para aprobar' });
    }
    const libro = await Libro.findByPk(p.libro_id, { transaction: t, lock: t.LOCK.UPDATE });
    if (libro.cantidad < 1) {
      await t.rollback();
      return res.status(400).json({ mensaje: 'Sin stock' });
    }
    await libro.update({ cantidad: libro.cantidad - 1 }, { transaction: t });
    await p.update({ estado: 'prestado', fecha_prestamo: new Date() }, { transaction: t });
    await t.commit();
    res.json(p);
  } catch (e) {
    await t.rollback();
    res.status(500).json({ mensaje: e.message });
  }
};

exports.devolver = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const p = await Prestamo.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!p || p.estado !== 'prestado') {
      await t.rollback();
      return res.status(400).json({ mensaje: 'Préstamo no válido para devolver' });
    }
    const libro = await Libro.findByPk(p.libro_id, { transaction: t });
    await libro.update({ cantidad: libro.cantidad + 1 }, { transaction: t });
    await p.update({ estado: 'devuelto', fecha_devolucion: new Date() }, { transaction: t });
    await t.commit();
    res.json(p);
  } catch (e) {
    await t.rollback();
    res.status(500).json({ mensaje: e.message });
  }
};
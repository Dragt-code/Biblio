const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

exports.register = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    const correoNormalizado = String(email || '').trim().toLowerCase();
    const nombreNormalizado = String(nombre || '').trim();
    if (!nombre || !email || !password)
      return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
    if (String(password).length < 6)
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres' });

    const existe = await Usuario.findOne({ 
      where: { email: correoNormalizado } 
    });
    if (existe) return res.status(409).json({ 
      mensaje: 'El email ya está registrado' 
    });

    const hash = await bcrypt.hash(password, 10);
    const u = await Usuario.create({ nombre: nombreNormalizado, email: correoNormalizado, password: hash, rol: 'usuario' });
    res.status(201).json({ id: u.id, nombre: u.nombre, email: u.email, rol: u.rol });
  } catch (e) {
    res.status(500).json({ mensaje: 'Error en el servidor', detalle: e.message });
  }
};

exports.login = async (req, res) => {
  try {
    const correoNormalizado = String(req.body.email || '').trim().toLowerCase();
    const { password } = req.body;
    const u = await Usuario.findOne({ where: { email: correoNormalizado } });
    if (!u || !(await bcrypt.compare(password, u.password)))
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });

    const token = jwt.sign({ id: u.id, rol: u.rol }, process.env.JWT_SECRET, { expiresIn: '4h' });
    res.json({ token, usuario: { id: u.id, nombre: u.nombre, rol: u.rol } });
  } catch (e) {
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
};
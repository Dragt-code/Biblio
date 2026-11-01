const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Usuario = sequelize.define('Usuario', {
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(120), allowNull: false, unique: true, validate: { isEmail: true } },
  password: { type: DataTypes.STRING(255), allowNull: false },
  rol: { type: DataTypes.ENUM('admin', 'usuario'), defaultValue: 'usuario' }
}, { tableName: 'usuarios', timestamps: false });

const Libro = sequelize.define('Libro', {
  titulo: { type: DataTypes.STRING(200), allowNull: false },
  autor: { type: DataTypes.STRING(120), allowNull: false },
  categoria: DataTypes.STRING(80),
  cantidad: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0 } }
}, { tableName: 'libros', timestamps: false });

const Prestamo = sequelize.define('Prestamo', {
  codigo: { type: DataTypes.STRING(8), allowNull: false, unique: true },
  fecha_prestamo: DataTypes.DATEONLY,
  fecha_devolucion: DataTypes.DATEONLY,
  estado: { type: DataTypes.ENUM('pendiente', 'prestado', 'devuelto'), defaultValue: 'pendiente' }
}, { tableName: 'prestamos', timestamps: false });

Usuario.hasMany(Prestamo, { foreignKey: 'usuario_id' });
Libro.hasMany(Prestamo, { foreignKey: 'libro_id' });
Prestamo.belongsTo(Usuario, { foreignKey: 'usuario_id' });
Prestamo.belongsTo(Libro, { foreignKey: 'libro_id' });

module.exports = { sequelize, Usuario, Libro, Prestamo };
CREATE DATABASE IF NOT EXISTS biblioteca CHARACTER SET utf8mb4;
USE biblioteca;

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol ENUM('admin','usuario') NOT NULL DEFAULT 'usuario'
);

CREATE TABLE libros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  autor VARCHAR(120) NOT NULL,
  categoria VARCHAR(80),
  cantidad INT NOT NULL DEFAULT 0
);

CREATE TABLE prestamos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(8) NOT NULL UNIQUE,
  usuario_id INT NOT NULL,
  libro_id INT NOT NULL,
  fecha_prestamo DATE,
  fecha_devolucion DATE,
  estado ENUM('pendiente','prestado','devuelto') NOT NULL DEFAULT 'pendiente',
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (libro_id) REFERENCES libros(id)
);

INSERT INTO libros (titulo, autor, categoria, cantidad) VALUES
('Cien años de soledad','Gabriel García Márquez','Novela',3),
('El Quijote','Miguel de Cervantes','Clásico',2);
CREATE USER 'myuser'@'%' IDENTIFIED BY 'secret';
GRANT ALL PRIVILEGES ON *.* TO 'myuser'@'%';
FLUSH PRIVILEGES;

CREATE DATABASE petstore;
USE petstore;

CREATE TABLE IF NOT EXISTS pet (
    pet_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    status ENUM ('available','pending','sold') NOT NULL
);

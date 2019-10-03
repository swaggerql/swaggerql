CREATE TYPE pet_status AS ENUM ('available','pending','sold');

CREATE TABLE pet (
    pet_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    status pet_status NOT NULL
);

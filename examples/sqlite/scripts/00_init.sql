CREATE TABLE pet (
    pet_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    status VARCHAR2(10) CHECK(status IN ('available','pending','sold')) NOT NULL
);
.quit

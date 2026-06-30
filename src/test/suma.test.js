//Prueba real

const sum = require('./suma');
test("la funcion suma deve devolver la suma correcta", () => {
    expect(sum(1, 2)).toBe(3);
});
console.log("calculos.js conectado correctamente ✅");

// Función 1: calcular el subtotal de una compra
function calcularSubtotal(precioProducto, cantidad) {
    let subtotal = precioProducto * cantidad;
    return subtotal;
}

// Función 2: aplicar un descuento
function calcularTotalConDescuento(subtotal, porcentajeDescuento) {
    let descuento = subtotal * (porcentajeDescuento / 100);
    let total = subtotal - descuento;
    return total;
}

// Variables
let nombreProducto = "Algodón de azúcar picante";
let precioProducto = 4.50;
let cantidad = 3;
let porcentajeDescuento = 10;

// Cálculos
let subtotal = calcularSubtotal(precioProducto, cantidad);
let totalFinal = calcularTotalConDescuento(subtotal, porcentajeDescuento);

// Mostrar resultados en la consola
console.log("Producto:", nombreProducto);
console.log("Precio unitario: $" + precioProducto);
console.log("Cantidad:", cantidad);
console.log("Subtotal: $" + subtotal);
console.log("Descuento:", porcentajeDescuento + "%");
console.log("Total a pagar: $" + totalFinal);
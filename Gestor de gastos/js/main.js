
let movimientos = JSON.parse(localStorage.getItem("movimientos")) || [];
let categorias = [];

const formMovimiento = document.getElementById("form-movimiento");
const inputConcepto = document.getElementById("concepto");
const inputMonto = document.getElementById("monto");
const selectTipo = document.getElementById("tipo");
const selectCategoria = document.getElementById("categoria");

const listaMovimientos = document.getElementById("lista-movimientos");
const spanSaldoTotal = document.getElementById("saldo-total");

const btnTodos = document.getElementById("btn-todos");
const btnIngresos = document.getElementById("btn-ingresos");
const btnGastos = document.getElementById("btn-gastos");

//  INICIALIZACIÓN Y FETCH 
document.addEventListener("DOMContentLoaded", () => {
    cargarCategorias();
    renderizarMovimientos(movimientos);
});

// Función para obtener categorías desde el archivo JSON local
async function cargarCategorias() {
    try {
    const response = await fetch("/json/categorias.json");
    if (!response.ok) throw new Error("Error al cargar categorías");
    
    categorias = await response.json();
    
    
    selectCategoria.innerHTML = '<option value="" disabled selected>Selecciona categoría</option>';
    categorias.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    selectCategoria.appendChild(option);
    });
} catch (error) {
    console.error("Fetch error:", error);
}
}

// LÓGICA Y AGREGADO DE MOVIMIENTOS 
formMovimiento.addEventListener("submit", (e) => {
e.preventDefault();

const concepto = inputConcepto.value.trim();
const monto = parseFloat(inputMonto.value);
const tipo = selectTipo.value;
const categoria = selectCategoria.value;

if (!concepto || isNaN(monto) || !categoria) return;

const nuevoMovimiento = {
    id: Date.now(),
    concepto,
    monto,
    tipo,
    categoria
};

movimientos.push(nuevoMovimiento);
guardarEnStorage();
renderizarMovimientos(movimientos);
formMovimiento.reset();

  // Librería: Toastify JS
Toastify({
    text: "¡Movimiento registrado con éxito!",
    duration: 3000,
    gravity: "bottom",
    position: "right",
    style: { background: "#2ecc71" }
}).showToast();
});

//  RENDERIZADO DEL DOM Y CÁLCULO DE BALANCE 
function renderizarMovimientos(lista) {
listaMovimientos.innerHTML = "";

lista.forEach(item => {
    const li = document.createElement("li");
    li.className = `item-movimiento ${item.tipo}`;
    li.innerHTML = `
    <span><strong>${item.concepto}</strong> (${item.categoria})</span>
    <span>${item.tipo === "ingreso" ? "+" : "-"}$${item.monto.toFixed(2)}</span>
    <button onclick="eliminarMovimiento(${item.id})">🗑️</button>
    `;
    listaMovimientos.appendChild(li);
});

actualizarSaldoTotal();
}

function actualizarSaldoTotal() {
const total = movimientos.reduce((acc, item) => {
    return item.tipo === "ingreso" ? acc + item.monto : acc - item.monto;
}, 0);

spanSaldoTotal.textContent = total.toFixed(2);
}

//  BORRADO CON SWEETALERT2
function eliminarMovimiento(id) {
  // Librería: SweetAlert2
Swal.fire({
    title: "¿Seguro que deseas eliminar?",
    text: "Esta acción no se puede deshacer",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar"
}).then((result) => {
    if (result.isConfirmed) {
    movimientos = movimientos.filter(item => item.id !== id);
    guardarEnStorage();
    renderizarMovimientos(movimientos);

    Swal.fire("Eliminado", "El registro ha sido borrado.", "success");
    }
});
}

//  PERSISTENCIA 
function guardarEnStorage() {
localStorage.setItem("movimientos", JSON.stringify(movimientos));
}

// FILTROS DE LISTA 
btnTodos.addEventListener("click", () => renderizarMovimientos(movimientos));
btnIngresos.addEventListener("click", () => {
const ingresos = movimientos.filter(item => item.tipo === "ingreso");
renderizarMovimientos(ingresos);
});
btnGastos.addEventListener("click", () => {
const gastos = movimientos.filter(item => item.tipo === "gasto");
renderizarMovimientos(gastos);
});
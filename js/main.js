// --- ESTADO GLOBAL ---
let movimientos = JSON.parse(localStorage.getItem("movimientos")) || [];
let categorias = [];
let miGrafico = null;

// --- REFERENCIAS AL DOM ---
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

// --- INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
  cargarCategorias();
  renderizarMovimientos(movimientos);
  actualizarGrafico();
});

// --- CARGA ASÍNCRONA DE CATEGORÍAS ---
async function cargarCategorias() {
  try {
    const response = await fetch("json/categorias.json");
    if (!response.ok) throw new Error("Error al cargar categorías");

    categorias = await response.json();

    selectCategoria.innerHTML =
      '<option value="" disabled selected>Selecciona categoría</option>';
    categorias.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      selectCategoria.appendChild(option);
    });
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

// --- REGISTRO DE MOVIMIENTOS ---
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
    categoria,
  };

  movimientos.push(nuevoMovimiento);
  guardarEnStorage();
  renderizarMovimientos(movimientos);
  actualizarGrafico();
  formMovimiento.reset();

  Toastify({
    text: "¡Movimiento registrado con éxito!",
    duration: 3000,
    gravity: "bottom",
    position: "right",
    style: { background: "#2ecc71" },
  }).showToast();
});

// --- RENDERIZADO Y CÁLCULO DE BALANCE ---
function renderizarMovimientos(lista) {
  listaMovimientos.innerHTML = "";

  lista.forEach((item) => {
    const li = document.createElement("li");
    li.className = `item-movimiento ${item.tipo}`;
    li.innerHTML = `
      <span><strong>${item.concepto}</strong> (${item.categoria})</span>
      <span>${item.tipo === "ingreso" ? "+" : "-"}$${item.monto.toFixed(2)}</span>
      <button type="button" onclick="eliminarMovimiento(${item.id})">🗑️</button>
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

// --- ELIMINACIÓN CON SWEETALERT2 ---
function eliminarMovimiento(id) {
  Swal.fire({
    title: "¿Seguro que deseas eliminar?",
    text: "Esta acción no se puede deshacer",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
  }).then((result) => {
    if (result.isConfirmed) {
      movimientos = movimientos.filter((item) => item.id !== id);
      guardarEnStorage();
      renderizarMovimientos(movimientos);
      actualizarGrafico();

      Swal.fire("Eliminado", "El registro ha sido borrado.", "success");
    }
  });
}

// --- PERSISTENCIA EN LOCALSTORAGE ---
function guardarEnStorage() {
  localStorage.setItem("movimientos", JSON.stringify(movimientos));
}

// --- FILTROS DE HISTORIAL ---
btnTodos.addEventListener("click", () => renderizarMovimientos(movimientos));
btnIngresos.addEventListener("click", () => {
  const ingresos = movimientos.filter((item) => item.tipo === "ingreso");
  renderizarMovimientos(ingresos);
});
btnGastos.addEventListener("click", () => {
  const gastos = movimientos.filter((item) => item.tipo === "gasto");
  renderizarMovimientos(gastos);
});

// --- RENDERIZADO DEL GRÁFICO (CHART.JS) ---
function actualizarGrafico() {
  const canvas = document.getElementById("grafico-gastos");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const soloGastos = movimientos.filter((m) => m.tipo === "gasto");

  const gastosPorCategoria = soloGastos.reduce((acc, gasto) => {
    acc[gasto.categoria] = (acc[gasto.categoria] || 0) + gasto.monto;
    return acc;
  }, {});

  const etiquetas = Object.keys(gastosPorCategoria);
  const datos = Object.values(gastosPorCategoria);

  if (miGrafico) {
    miGrafico.destroy();
  }

  if (etiquetas.length === 0) {
    return;
  }

  miGrafico = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: etiquetas,
      datasets: [
        {
          data: datos,
          backgroundColor: [
            "#ef4444",
            "#f59e0b",
            "#10b981",
            "#3b82f6",
            "#8b5cf6",
            "#ec4899",
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}
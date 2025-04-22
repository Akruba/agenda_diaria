document.addEventListener('DOMContentLoaded', () => {
    // --- Contenedores ---
    const sourceLists = {
        morning: document.getElementById('source-morning'),
        school: document.getElementById('source-school'),
        afternoon: document.getElementById('source-afternoon'),
        tasks: document.getElementById('source-tasks'),
        habit: document.getElementById('source-habit')
    };
    const agendaContainer = document.getElementById('daily-agenda');
    const calendarContainer = document.getElementById('calendar');
    const resetTrackerButton = document.getElementById('reset-tracker');

    // --- Datos de Alex ---
    // (Mismos datos que antes - sin cambios aquí)
    const sourceData = {
        morning: [
            { id: 'm1', text: 'Despertar', duration: '6:30 AM', type: 'routine' },
            { id: 'm2', text: 'Desayuno y Prepararse', duration: '30 min', type: 'routine' },
            { id: 'm3', text: 'Salir de casa', duration: '7:20 AM', type: 'routine' },
            { id: 'm4', text: 'Viaje en autobús', duration: '25 min', type: 'routine' }
        ],
        school: [
            { id: 's1', text: 'Llegada Escuela / Tiempo Libre', duration: '7:45 AM', type: 'school' },
            { id: 's2', text: 'CLASE: Matemáticas', duration: '60 min', type: 'school' },
            { id: 's3', text: 'CLASE: Ciencias', duration: '60 min', type: 'school' },
            { id: 's4', text: 'Descanso / Recreo', duration: '15 min', type: 'school' },
            { id: 's5', text: 'CLASE: Historia', duration: '60 min', type: 'school' },
            { id: 's6', text: 'CLASE: Lengua', duration: '60 min', type: 'school' },
            { id: 's7', text: 'Almuerzo', duration: '30 min', type: 'school' },
            { id: 's8', text: 'CLASE: Educación Física', duration: '60 min', type: 'school' },
            { id: 's9', text: 'Tiempo libre / Organizar salida', duration: '15 min', type: 'school' },
            { id: 's10', text: 'Salida Escuela', duration: '2:00 PM', type: 'school' },
            { id: 's11', text: 'Viaje de regreso', duration: '25 min', type: 'routine' }
        ],
        afternoon: [
            { id: 'a1', text: 'Llegada a casa', duration: '~2:25 PM', type: 'routine' },
            { id: 'a2', text: 'Merienda y Descanso', duration: '30 min', type: 'routine' },
            { id: 'a3', text: 'Clase de Guitarra (Online)', duration: '45 min', type: 'activity' },
            { id: 'a4', text: 'Poner la mesa', duration: '5 min', type: 'routine' },
            { id: 'a5', text: 'Cena Familiar', duration: '30-40 min', type: 'routine' },
            { id: 'a6', text: 'Tiempo Libre / Relajación', duration: '', type: 'routine' },
            { id: 'a7', text: 'Prepararse para dormir', duration: '9:30 PM', type: 'routine' },
            { id: 'a8', text: 'Dormir', duration: '10:00 PM', type: 'routine' }
        ],
        tasks: [
            { id: 't1', text: 'Mates: 5 problemas', duration: '30 min', type: 'task', priority: 1 },
            { id: 't2', text: 'Lengua: Resumen', duration: '20 min', type: 'task', priority: 1 },
            { id: 't3', text: 'Ciencias: Estudiar', duration: '25 min', type: 'task', priority: 2 },
            { id: 't4', text: 'Historia: Leer Cap. 3', duration: '40 min', type: 'task', priority: 2 },
            { id: 't5', text: 'Practicar Guitarra', duration: '15 min', type: 'task' }
        ],
        habit: [
            { id: 'h1', text: 'Leer libro aventuras', duration: '10 min', type: 'habit' }
        ]
    };


    let draggedElement = null; // Elemento DOM que se está arrastrando
    let sourceItemId = null;   // ID del item original (si viene de la lista fuente)
    let isDraggingFromAgenda = false; // Flag para saber si se arrastra desde la agenda

    let nextAgendaItemId = 0; // Para IDs únicos de items en la agenda

    // --- Inicialización ---

    // 1. Poblar listas de origen
    for (const listKey in sourceData) {
        if (sourceLists[listKey]) {
            sourceData[listKey].forEach(itemData => {
                const itemElement = createSourceItemElement(itemData);
                sourceLists[listKey].appendChild(itemElement);
            });
        }
    }

    // 2. Generar Cuadrícula de Agenda
    for (let hour = 6; hour <= 22; hour++) {
        const timeString = `${hour}:00`;
        const timeSlot = document.createElement('div');
        timeSlot.classList.add('time-slot');
        const timeLabel = document.createElement('div');
        timeLabel.classList.add('time-label');
        timeLabel.textContent = timeString;
        const dropZone = document.createElement('div');
        dropZone.classList.add('drop-zone');
        dropZone.dataset.time = timeString;
        dropZone.addEventListener('dragover', handleDragOver);
        dropZone.addEventListener('dragleave', handleDragLeave);
        dropZone.addEventListener('drop', handleDrop);
        timeSlot.appendChild(timeLabel);
        timeSlot.appendChild(dropZone);
        agendaContainer.appendChild(timeSlot);
    }

    // 3. Inicializar Calendario Seinfeld
    const calendarMarkedColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || '#FFA500';
    let seinfeldDataSource = []; // Array para guardar las fechas marcadas

    const calendar = new Calendar(calendarContainer, {
        language: 'es',
        style: 'custom', // Usaremos custom para definir colores
        dataSource: seinfeldDataSource, // Empezar vacío
        enableContextMenu: false,
        enableRangeSelection: false,
        minDate: new Date(new Date().getFullYear(), 0, 1), // Inicio del año actual
        maxDate: new Date(new Date().getFullYear(), 11, 31), // Fin del año actual
        customDataSourceRenderer: (element, date, events) => {
            // Si hay eventos (días marcados) para esta fecha, aplicar estilo
            if (events.length > 0) {
                element.style.backgroundColor = calendarMarkedColor;
                element.style.color = 'white';
                element.style.borderRadius = '50%';
            }
        },
        clickDay: (e) => {
            toggleSeinfeldMark(e.date); // Pasar solo la fecha
        }
    });

    // --- Funciones ---

    function createSourceItemElement(itemData) {
        const div = document.createElement('div');
        div.classList.add('draggable-item');
        div.dataset.itemId = itemData.id;
        div.dataset.type = itemData.type;
        div.setAttribute('draggable', true);
        div.innerHTML = `
            ${itemData.text}
            ${itemData.duration ? `<span class="item-duration">(${itemData.duration})</span>` : ''}
            ${itemData.priority ? `<span class="item-priority">(P${itemData.priority})</span>` : ''}
        `;
        div.addEventListener('dragstart', handleDragStartSource);
        div.addEventListener('dragend', handleDragEnd);
        return div;
    }

    function createAgendaItemElement(itemData) {
        const div = document.createElement('div');
        const uniqueId = `agenda-item-${nextAgendaItemId++}`;
        div.classList.add('draggable-item', 'agenda-item');
        div.dataset.type = itemData.type;
        div.dataset.agendaId = uniqueId; // ID único en la agenda
        div.dataset.sourceId = itemData.id;
        div.setAttribute('draggable', true); // HACERLO ARRASTRABLE
        div.innerHTML = `
            ${itemData.text}
            ${itemData.duration ? `<span class="item-duration">(${itemData.duration})</span>` : ''}
            ${itemData.priority ? `<span class="item-priority">(P${itemData.priority})</span>` : ''}
            <button class="delete-item-btn" title="Eliminar">×</button>
        `;
        // **CORRECCIÓN:** Usar un listener genérico para el dragstart de items en agenda
        div.addEventListener('dragstart', handleDragStartAgenda);
        div.addEventListener('dragend', handleDragEnd);
        div.querySelector('.delete-item-btn').addEventListener('click', handleDeleteItem);
        return div;
    }

    function findSourceDataById(id) {
        for (const listKey in sourceData) {
            const found = sourceData[listKey].find(item => item.id === id);
            if (found) return found;
        }
        return null;
    }

    // --- Lógica de Drag & Drop (Revisada) ---

    function handleDragStartSource(e) {
        // Arrastrando desde la lista de fuentes
        draggedElement = this;
        sourceItemId = this.dataset.itemId; // Guardar ID original
        isDraggingFromAgenda = false;

        e.dataTransfer.setData('text/plain', sourceItemId);
        e.dataTransfer.effectAllowed = 'copy';
        setTimeout(() => this.classList.add('dragging'), 0);
        // console.log('DragStart Source:', sourceItemId);
    }

    function handleDragStartAgenda(e) {
        // Arrastrando desde DENTRO de la agenda
        // Evitar que el botón de borrar inicie el drag
        if (e.target.classList.contains('delete-item-btn')) {
             e.preventDefault();
             return;
        }
        draggedElement = this; // El elemento de la agenda que se arrastra
        sourceItemId = null; // No viene de la fuente original directamente
        isDraggingFromAgenda = true;

        // Pasar el ID único del elemento de la agenda para identificarlo al soltar
        e.dataTransfer.setData('text/plain', this.dataset.agendaId);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => this.classList.add('dragging'), 0);
        // console.log('DragStart Agenda:', this.dataset.agendaId);
    }

    function handleDragEnd() {
        // Limpieza después de cualquier drag
        if (draggedElement) {
            draggedElement.classList.remove('dragging');
        }
        draggedElement = null;
        sourceItemId = null;
        isDraggingFromAgenda = false;
        // console.log('DragEnd');
    }

    function handleDragOver(e) {
        e.preventDefault();
        this.classList.add('drag-over');
        e.dataTransfer.dropEffect = isDraggingFromAgenda ? 'move' : 'copy';
    }

    function handleDragLeave() {
        this.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        this.classList.remove('drag-over');

        if (!draggedElement) return; // Si no hay nada arrastrándose, salir

        const targetDropZone = this; // La zona donde se soltó

        if (isDraggingFromAgenda) {
            // --- Moviendo un item DENTRO de la agenda ---
            // Simplemente añadir el elemento arrastrado a la nueva zona.
            // appendChild lo moverá automáticamente del padre anterior.
            // No es necesario verificar si es la misma zona, appendChild lo manejará.
             targetDropZone.appendChild(draggedElement);
            // console.log('Moved Agenda Item:', draggedElement.dataset.agendaId, 'to zone:', targetDropZone.dataset.time);

        } else if (sourceItemId) {
            // --- Añadiendo un NUEVO item desde la lista fuente (Clonando) ---
            const originalData = findSourceDataById(sourceItemId);
            if (originalData) {
                const newAgendaItem = createAgendaItemElement(originalData);
                targetDropZone.appendChild(newAgendaItem);
                // console.log('Cloned Source Item:', sourceItemId, 'to zone:', targetDropZone.dataset.time);
            }
        }

        // Limpiar explícitamente por si acaso, aunque handleDragEnd debería hacerlo
        draggedElement = null;
        sourceItemId = null;
        isDraggingFromAgenda = false;
    }

    // --- Lógica de Borrar Item ---
    function handleDeleteItem(e) {
        const itemToDelete = e.target.closest('.agenda-item');
        if (itemToDelete) {
            itemToDelete.remove();
            // console.log('Deleted Agenda Item:', itemToDelete.dataset.agendaId);
        }
    }

    // --- Lógica del Calendario Seinfeld (Revisada) ---

    function toggleSeinfeldMark(date) {
        const dateString = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        const existingIndex = seinfeldDataSource.findIndex(item => item.startDate.toISOString().split('T')[0] === dateString);

        if (existingIndex > -1) {
            // Si ya está marcado, quitarlo
            seinfeldDataSource.splice(existingIndex, 1);
            // console.log('Unmarked date:', dateString);
        } else {
            // Si no está marcado, añadirlo
            seinfeldDataSource.push({
                id: Date.now(), // ID único simple
                name: "Hábito", // Nombre (opcional)
                // location: "", // Ubicación (opcional)
                startDate: date,
                endDate: date,
                 color: calendarMarkedColor // **Importante para estilo 'custom'**
            });
            // console.log('Marked date:', dateString);
        }

        // Actualizar el calendario con los nuevos datos
        calendar.setDataSource(seinfeldDataSource);
    }

    resetTrackerButton.addEventListener('click', () => {
        seinfeldDataSource = []; // Vaciar nuestro array de datos
        calendar.setDataSource(seinfeldDataSource); // Actualizar el calendario
        // console.log('Calendar Reset');
    });

}); // Fin del DOMContentLoaded
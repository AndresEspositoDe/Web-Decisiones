// Configuración de Firebase - REEMPLAZA CON TUS DATOS
const firebaseConfig = {
  apiKey: "AIzaSyA7ZLApADgaiuEb0jYq2CRjGfKsJVJs1Cg",
  authDomain: "web-desiciones.firebaseapp.com",
  projectId: "web-desiciones",
  storageBucket: "web-desiciones.firebasestorage.app",
  messagingSenderId: "850430817535",
  appId: "1:850430817535:web:299139648cff9ce20608ca"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

class GestorDatosFirebase {
    constructor() {
        this.datosGuardados = [];
        this.ultimaPersona = null;
        this.contadorUsuarios = 0;
        
        // Contadores por persona
        this.contadores = {
            Rafa: 0,
            Tana: 0,
            TheGoat: 0
        };
        
        this.porcentajes = {
            Rafa: 0,
            Tana: 0,
            TheGoat: 0
        };
        
        this.totalDecisiones = 0;
        this.personaLider = null;
        this.ultimoLider = null;
        this.usuarioId = this.generarIdUsuario();
        
        this.inicializarElementos();
        this.configurarEventos();
        this.inicializarFirebase();
    }

    generarIdUsuario() {
        // Generar un ID único para el usuario
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('userId', userId);
        }
        return userId;
    }

    inicializarElementos() {
        // Elementos del formulario
        this.form = document.getElementById('dataForm');
        this.nombreSelect = document.getElementById('nombre');
        this.fechaInput = document.getElementById('fecha');
        this.decisionInput = document.getElementById('decision');
        this.guardarBtn = document.getElementById('guardarBtn');
        this.mensajeDiv = document.getElementById('mensaje');
        this.listaDatos = document.getElementById('listaDatos');
        
        // Elementos de última persona
        this.ultimaPersonaDiv = document.getElementById('ultimaPersona');
        this.avatarImg = document.getElementById('avatarImg');
        this.ultimoNombreSpan = document.getElementById('ultimoNombre');
        this.ultimaFechaSpan = document.getElementById('ultimaFecha');
        
        // Elementos de conexión
        this.estadoConexion = document.getElementById('estadoConexion');
        this.contadorUsuariosSpan = document.getElementById('contadorUsuarios');
        
        // Elementos para contadores por persona
        this.contadorRafa = document.getElementById('contadorRafa');
        this.contadorTana = document.getElementById('contadorTana');
        this.contadorGoat = document.getElementById('contadorGoat');
        
        this.porcentajeRafa = document.getElementById('porcentajeRafa');
        this.porcentajeTana = document.getElementById('porcentajeTana');
        this.porcentajeGoat = document.getElementById('porcentajeGoat');
        
        this.progressRafa = document.getElementById('progressRafa');
        this.progressTana = document.getElementById('progressTana');
        this.progressGoat = document.getElementById('progressGoat');
        
        this.totalDecisionesEl = document.getElementById('totalDecisiones');
        this.personaLiderEl = document.getElementById('personaLider');
        
        // Referencias a las tarjetas
        this.tarjetasPersonas = document.querySelectorAll('.persona-stat-card');
    }

    configurarEventos() {
        this.guardarBtn.addEventListener('click', () => this.guardarDatos());
        
        this.nombreSelect.addEventListener('change', () => {
            this.limpiarMensaje();
        });
        
        this.decisionInput.addEventListener('input', () => this.limpiarMensaje());
        
        this.decisionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.guardarDatos();
            }
        });
    }

    inicializarFirebase() {
        // Escuchar cambios en la colección de datos
        db.collection('formularioDatos')
            .orderBy('timestamp', 'desc')
            .onSnapshot((snapshot) => {
                this.datosGuardados = [];
                snapshot.forEach((doc) => {
                    this.datosGuardados.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                this.mostrarDatosGuardados();
                this.actualizarUltimaPersona();
                this.calcularEstadisticasPersonas();
            });

        // Escuchar cambios en el contador de usuarios
        db.collection('estado').doc('usuarios')
            .onSnapshot((doc) => {
                if (doc.exists) {
                    this.contadorUsuarios = doc.data().contador || 0;
                    this.actualizarContadorUsuarios();
                }
            });

        // Registrar usuario conectado
        this.registrarUsuario();
    }

    async registrarUsuario() {
        const usuarioRef = db.collection('estado').doc('usuarios');
        
        try {
            // Incrementar contador
            await usuarioRef.set({
                contador: firebase.firestore.FieldValue.increment(1),
                ultimaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // Manejar cuando el usuario cierra la página
            window.addEventListener('beforeunload', async () => {
                try {
                    await usuarioRef.set({
                        contador: firebase.firestore.FieldValue.increment(-1),
                        ultimaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                } catch (error) {
                    console.error('Error al descontar usuario:', error);
                }
            });
        } catch (error) {
            console.error('Error registrando usuario:', error);
        }
    }

    actualizarContadorUsuarios() {
        this.contadorUsuariosSpan.textContent = `${this.contadorUsuarios} usuarios conectados`;
    }

    obtenerFechaActual() {
        const ahora = new Date();
        return ahora.toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    obtenerAvatarPorNombre(nombre) {
        const avatares = {
            'Rafa': './images/Rafa.jpeg',
            'Tana': './images/Tana.jpg', 
            'TheGoat': './images/Andres.jpg',
            'default': './images/Nadie.webp'
        };
        return avatares[nombre] || avatares['default'];
    }

    actualizarUltimaPersona() {
        if (this.datosGuardados.length > 0) {
            const ultimo = this.datosGuardados[0];
            this.ultimaPersona = ultimo;
            this.mostrarUltimaPersona();
        } else {
            this.ultimaPersona = null;
            this.mostrarUltimaPersona();
        }
    }

    mostrarUltimaPersona() {
        if (!this.ultimaPersona) {
            this.ultimaPersonaDiv.className = 'ultima-persona vacio';
            this.ultimoNombreSpan.textContent = 'Nadie aún';
            this.ultimaFechaSpan.textContent = 'Sé el primero en decidir o jodete';
            this.avatarImg.src = this.obtenerAvatarPorNombre('default');
            return;
        }

        this.ultimoNombreSpan.textContent = this.ultimaPersona.nombre;
        this.ultimaFechaSpan.textContent = this.ultimaPersona.fecha;
        this.avatarImg.src = this.obtenerAvatarPorNombre(this.ultimaPersona.nombre);
        
        this.ultimaPersonaDiv.className = `ultima-persona nuevo-registro ${this.ultimaPersona.nombre.toLowerCase()}`;
        
        setTimeout(() => {
            this.ultimaPersonaDiv.classList.remove('nuevo-registro');
        }, 3000);
    }

    // Métodos para estadísticas por persona
    calcularEstadisticasPersonas() {
        // Reiniciar contadores
        this.contadores = { Rafa: 0, Tana: 0, TheGoat: 0 };
        
        // Contar decisiones por persona
        this.datosGuardados.forEach(dato => {
            if (this.contadores.hasOwnProperty(dato.nombre)) {
                this.contadores[dato.nombre]++;
            }
        });
        
        this.totalDecisiones = this.datosGuardados.length;
        
        // Calcular porcentajes
        if (this.totalDecisiones > 0) {
            Object.keys(this.contadores).forEach(persona => {
                this.porcentajes[persona] = Math.round((this.contadores[persona] / this.totalDecisiones) * 100);
            });
        }
        
        // Determinar líder
        this.determinarLider();
        
        // Actualizar la UI
        this.actualizarContadoresUI();
    }

    determinarLider() {
        let maxDecisiones = 0;
        let nuevoLider = null;
        
        Object.keys(this.contadores).forEach(persona => {
            if (this.contadores[persona] > maxDecisiones) {
                maxDecisiones = this.contadores[persona];
                nuevoLider = persona;
            }
        });
        
        // Si hay empate
        const empate = Object.values(this.contadores).filter(count => count === maxDecisiones).length > 1;
        
        if (empate) {
            this.personaLider = 'Empate';
        } else if (maxDecisiones === 0) {
            this.personaLider = 'Nadie aún';
        } else {
            this.personaLider = nuevoLider;
            
            // Si hay un cambio de líder, animar
            if (this.ultimoLider && this.ultimoLider !== this.personaLider && this.ultimoLider !== 'Empate' && this.personaLider !== 'Empate') {
                this.animarCambioDeLider(this.ultimoLider, this.personaLider);
            }
            
            this.ultimoLider = this.personaLider;
        }
    }

    actualizarContadoresUI() {
        // Actualizar números
        this.actualizarNumeroConAnimacion('Rafa', this.contadores.Rafa);
        this.actualizarNumeroConAnimacion('Tana', this.contadores.Tana);
        this.actualizarNumeroConAnimacion('TheGoat', this.contadores.TheGoat);
        
        // Actualizar porcentajes
        this.porcentajeRafa.textContent = `${this.porcentajes.Rafa}%`;
        this.porcentajeTana.textContent = `${this.porcentajes.Tana}%`;
        this.porcentajeGoat.textContent = `${this.porcentajes.TheGoat}%`;
        
        // Actualizar barras de progreso
        this.actualizarBarrasProgreso();
        
        // Actualizar totales
        this.actualizarNumeroConAnimacion('total', this.totalDecisiones);
        this.personaLiderEl.textContent = this.personaLider;
        
        // Destacar al líder actual
        this.destacarLider();
    }

    actualizarNumeroConAnimacion(tipo, nuevoValor) {
        let elemento;
        
        switch(tipo) {
            case 'Rafa':
                elemento = this.contadorRafa;
                break;
            case 'Tana':
                elemento = this.contadorTana;
                break;
            case 'TheGoat':
                elemento = this.contadorGoat;
                break;
            case 'total':
                elemento = this.totalDecisionesEl;
                break;
            default:
                return;
        }
        
        const valorActual = parseInt(elemento.textContent) || 0;
        
        if (nuevoValor > valorActual) {
            // Animación de incremento
            elemento.classList.add('animating');
            elemento.classList.add('highlight');
            
            // Crear efecto de partículas
            this.crearParticulasIncremento(tipo);
            
            setTimeout(() => {
                elemento.textContent = nuevoValor;
                elemento.classList.remove('animating');
            }, 400);
            
            setTimeout(() => {
                elemento.classList.remove('highlight');
            }, 1400);
        } else {
            elemento.textContent = nuevoValor;
        }
    }

    actualizarBarrasProgreso() {
        const maxPorcentaje = Math.max(...Object.values(this.porcentajes));
        
        // Animar las barras de progreso
        this.animateProgressBar(this.progressRafa, this.porcentajes.Rafa);
        this.animateProgressBar(this.progressTana, this.porcentajes.Tana);
        this.animateProgressBar(this.progressGoat, this.porcentajes.TheGoat);
        
        // Destacar la barra con mayor porcentaje
        setTimeout(() => {
            if (this.porcentajes.Rafa === maxPorcentaje && maxPorcentaje > 0) {
                this.destacarBarra(this.progressRafa);
            }
            if (this.porcentajes.Tana === maxPorcentaje && maxPorcentaje > 0) {
                this.destacarBarra(this.progressTana);
            }
            if (this.porcentajes.TheGoat === maxPorcentaje && maxPorcentaje > 0) {
                this.destacarBarra(this.progressGoat);
            }
        }, 1500);
    }

    animateProgressBar(barra, porcentaje) {
        // Resetear la animación
        barra.style.transition = 'none';
        barra.style.width = '0%';
        
        // Forzar reflow
        barra.offsetHeight;
        
        // Animar al porcentaje final
        barra.style.transition = 'width 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        barra.style.width = `${porcentaje}%`;
    }

    destacarBarra(barra) {
        barra.classList.add('highlight-bar');
        
        setTimeout(() => {
            barra.classList.remove('highlight-bar');
        }, 2000);
    }

    destacarLider() {
        // Remover indicador de líder anterior
        document.querySelectorAll('.lider-indicator').forEach(indicator => {
            indicator.remove();
        });
        
        // Remover clase de líder anterior
        this.tarjetasPersonas.forEach(card => {
            card.classList.remove('lider-actual');
        });
        
        // Si hay un líder único, destacar su tarjeta
        if (this.personaLider && this.personaLider !== 'Empate' && this.personaLider !== 'Nadie aún') {
            const tarjetaLider = document.querySelector(`.persona-stat-card[data-persona="${this.personaLider}"]`);
            
            if (tarjetaLider) {
                tarjetaLider.classList.add('lider-actual');
                
                // Agregar indicador visual
                const liderIndicator = document.createElement('div');
                liderIndicator.className = 'lider-indicator';
                liderIndicator.textContent = 'LÍDER';
                tarjetaLider.appendChild(liderIndicator);
                
                // Efecto especial
                tarjetaLider.style.transform = 'translateY(-5px)';
                tarjetaLider.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.2)';
                
                setTimeout(() => {
                    tarjetaLider.style.transform = '';
                    tarjetaLider.style.boxShadow = '';
                }, 2000);
            }
        }
    }

    crearParticulasIncremento(persona) {
        const tarjeta = document.querySelector(`.persona-stat-card[data-persona="${persona}"]`);
        if (!tarjeta) return;
        
        const rect = tarjeta.getBoundingClientRect();
        const colors = {
            Rafa: '#2196F3',
            Tana: '#e91e63',
            TheGoat: '#ff9800'
        };
        
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'confetti-piece';
            particle.style.setProperty('--confetti-color', colors[persona]);
            
            // Posición aleatoria dentro de la tarjeta
            const x = Math.random() * rect.width;
            const y = Math.random() * rect.height;
            
            particle.style.left = `${rect.left + x}px`;
            particle.style.top = `${rect.top + y}px`;
            
            // Tamaño y forma aleatorios
            const size = 5 + Math.random() * 10;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            if (Math.random() > 0.5) {
                particle.style.borderRadius = '50%';
            }
            
            document.body.appendChild(particle);
            
            // Animación
            setTimeout(() => {
                particle.classList.add('confetti-fall');
                particle.style.animationDelay = `${Math.random() * 0.5}s`;
                
                // Remover después de la animación
                setTimeout(() => {
                    particle.remove();
                }, 2000);
            }, 10);
        }
    }

    animarCambioDeLider(liderAnterior, liderNuevo) {
        // Mostrar mensaje especial
        this.mostrarMensaje(`🎉 ¡${liderNuevo} es el nuevo líder!`, 'exito');
        
        // Efecto de confeti especial
        this.mostrarConfetiEspecial();
        
        // Sonido de victoria (opcional)
        this.reproducirSonidoVictoria();
    }

    mostrarConfetiEspecial() {
        const colors = ['#FFD700', '#C0C0C0', '#CD7F32', '#4CAF50', '#2196F3', '#E91E63'];
        
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.setProperty('--confetti-color', colors[Math.floor(Math.random() * colors.length)]);
            
            // Posición aleatoria en la parte superior
            confetti.style.left = `${Math.random() * 100}vw`;
            confetti.style.top = '-20px';
            
            // Tamaño y forma
            const size = 8 + Math.random() * 15;
            confetti.style.width = `${size}px`;
            confetti.style.height = `${size}px`;
            
            if (Math.random() > 0.5) {
                confetti.style.borderRadius = '50%';
            }
            
            document.body.appendChild(confetti);
            
            // Animación con diferentes velocidades
            setTimeout(() => {
                confetti.classList.add('confetti-fall');
                confetti.style.animationDuration = `${1 + Math.random() * 2}s`;
                confetti.style.animationDelay = `${Math.random() * 0.5}s`;
                
                // Remover después
                setTimeout(() => {
                    confetti.remove();
                }, 3000);
            }, 10);
        }
    }

    reproducirSonidoVictoria() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator1 = audioContext.createOscillator();
            const oscillator2 = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator1.connect(gainNode);
            oscillator2.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Melodía de victoria
            oscillator1.frequency.setValueAtTime(523.25, audioContext.currentTime); // Do
            oscillator2.frequency.setValueAtTime(659.25, audioContext.currentTime); // Mi
            
            oscillator1.frequency.exponentialRampToValueAtTime(1046.50, audioContext.currentTime + 0.3); // Do alto
            oscillator2.frequency.exponentialRampToValueAtTime(1318.51, audioContext.currentTime + 0.3); // Mi alto
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator1.start();
            oscillator2.start();
            oscillator1.stop(audioContext.currentTime + 0.5);
            oscillator2.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            // Silenciar error si el audio no está disponible
        }
    }

    validarFormulario() {
        if (!this.nombreSelect.value) {
            this.mostrarMensaje('Por favor, selecciona un nombre', 'error');
            this.nombreSelect.focus();
            return false;
        }

        if (!this.decisionInput.value.trim()) {
            this.mostrarMensaje('Por favor, escribe una decisión', 'error');
            this.decisionInput.focus();
            return false;
        }

        return true;
    }

    async guardarDatos() {
        if (!this.validarFormulario()) {
            return;
        }

        this.guardarBtn.disabled = true;
        this.guardarBtn.textContent = 'Guardando...';

        try {
            const fechaClick = this.obtenerFechaActual();
            this.fechaInput.value = fechaClick;

            const nuevoDato = {
                nombre: this.nombreSelect.value,
                fecha: fechaClick,
                decision: this.decisionInput.value.trim(),
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                usuarioId: this.usuarioId
            };

            // Guardar en Firebase
            await db.collection('formularioDatos').add(nuevoDato);
            
            this.mostrarMensaje('Datos guardados correctamente', 'exito');
            this.limpiarFormulario();
            
        } catch (error) {
            console.error('Error al guardar:', error);
            this.mostrarMensaje('Error al guardar los datos', 'error');
        } finally {
            this.guardarBtn.disabled = false;
            this.guardarBtn.textContent = 'Guardar Datos';
        }
    }

    mostrarDatosGuardados() {
        if (this.datosGuardados.length === 0) {
            this.listaDatos.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No hay datos guardados aún.</p>';
            return;
        }

        this.listaDatos.innerHTML = this.datosGuardados.map(dato => `
            <div class="item-dato">
                <p><strong>Nombre:</strong> ${this.escapeHTML(dato.nombre)}</p>
                <p><strong>Fecha:</strong> ${dato.fecha}</p>
                <p><strong>Decisión:</strong> ${this.escapeHTML(dato.decision)}</p>
                <button onclick="gestorDatos.eliminarDato('${dato.id}')" class="btn-eliminar">
                    Eliminar
                </button>
            </div>
        `).join('');
    }

    async eliminarDato(id) {
        const boton = event.target;
        const item = boton.closest('.item-dato');
        
        // Confirmación con estilo
        if (!confirm('¿Estás seguro de que quieres eliminar este registro?')) {
            return;
        }
        
        try {
            // Efecto visual de eliminación
            boton.className = 'btn-eliminar eliminando';
            boton.innerHTML = 'Eliminando...';
            item.classList.add('eliminando');
            
            // Eliminar de Firebase
            await db.collection('formularioDatos').doc(id).delete();
            
            // Animación de desaparición
            item.style.transition = 'all 0.5s ease';
            item.style.opacity = '0';
            item.style.transform = 'translateX(-100%)';
            item.style.margin = '0';
            item.style.padding = '0';
            item.style.maxHeight = '0';
            item.style.overflow = 'hidden';
            
            setTimeout(() => {
                this.mostrarMensaje('✅ Dato eliminado correctamente', 'exito');
            }, 500);
            
        } catch (error) {
            console.error('Error al eliminar:', error);
            this.mostrarMensaje('❌ Error al eliminar el dato', 'error');
            
            // Restaurar botón
            boton.className = 'btn-eliminar';
            boton.innerHTML = 'Eliminar';
            item.classList.remove('eliminando');
        }
    }

    mostrarMensaje(mensaje, tipo) {
        this.mensajeDiv.textContent = mensaje;
        this.mensajeDiv.className = `mensaje ${tipo}`;
        this.mensajeDiv.style.display = 'block';
        
        setTimeout(() => {
            this.limpiarMensaje();
        }, 4000);
    }

    limpiarMensaje() {
        this.mensajeDiv.style.display = 'none';
        this.mensajeDiv.className = 'mensaje';
    }

    limpiarFormulario() {
        this.nombreSelect.value = '';
        this.decisionInput.value = '';
        this.nombreSelect.focus();
    }

    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    window.gestorDatos = new GestorDatosFirebase();
});
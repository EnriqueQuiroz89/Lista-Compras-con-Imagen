console.log("Agregado");

/// Inicializar CLOUDINARI para la carga de imagenes.
const cloudName = 'muchosregistros';
const unsignedUploadPreset = 'bbisdqo0';
// id del Url que permite agregar fotos
var fileSelect = document.getElementById("fileSelect");
// Aun no entiendo que hace
var fileElem = document.getElementById("fileElem");


// Initialize Cloud Firestore through Firebase
firebase.initializeApp({
    apiKey: "AIzaSyC7IxVax8cZ5eLwEhlHE5leNVlX7TBUIQ0",
    authDomain: "firestorecrud-f8226.firebaseapp.com",
    projectId: "firestorecrud-f8226",
});

var db = firebase.firestore();

// Seleccionar Imagen
/** Pasos
 *  1. Al hacer Click en el Link "Elige imagen" invoca funcion(e) anonima
 *  2. La funcion anonima evalua si existe la variable "fileElem" 
 *  3. fileElem es la invocacion  de un input de tipo archivo que esta oculto
 *  4. Al existir fileElem la funcion simula un Click en el campo y despliega 
 *     la ventana para elegir.   
 */
fileSelect.addEventListener("click", function (e) {
    if (fileElem) {
        fileElem.click();
    }
    e.preventDefault(); // prevent navigation to "#"
}, false);

// *********** Upload file to Cloudinary ******************** //
function uploadFile(file) {
    var url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
    var xhr = new XMLHttpRequest();
    var fd = new FormData();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

    xhr.onreadystatechange = function (e) {
        if (xhr.readyState == 4 && xhr.status == 200) {
            // File uploaded successfully
            var response = JSON.parse(xhr.responseText);
            // https://res.cloudinary.com/cloudName/image/upload/v1483481128/public_id.jpg

            /**Extrae la URL del JSON respuesta*/
            var url = response.secure_url;
            console.log(url); /**URL extraida de la respuesta */

            // Create a thumbnail of the uploaded image, with 150px width
            var tokens = url.split('/'); /**DIVIDE LA URL y su delimitador es */

            console.log(tokens); /**Arreglo de strings con el resultado de la division. */

            tokens.splice(-2, 0, 'w_150,c_scale'); /**Inserta elemento dos posiciones antes ultimo*/
            // w=width y h=height --> 150=150 px                 

            var img = new Image(); // HTML5 Constructor
            img.src = tokens.join('/');  /**Asigna el nuevo URL reconfigurado con escala*/
            img.alt = response.public_id;  /**Por si no se muestra la imagen*/

            document.getElementById('gallery').appendChild(img); /**Agrega a la Galeria la imagen recien creada*/

            // Agregar url del Thumbnail al formulario
            document.getElementById('imagen').value = img.src;
        }
    };

    fd.append('upload_preset', unsignedUploadPreset);
    fd.append('tags', 'browser_upload'); // Optional - add tag for image admin in Cloudinary
    fd.append('file', file);
    xhr.send(fd);
}

// *********** Handle selected files ******************** //
var handleFiles = function (files) {
    for (var i = 0; i < files.length; i++) {
        uploadFile(files[i]); // call the function to upload the file
    }
};

// Agregar documentos
function guardar() {
    //Tres varaibles para la tarea
    var articulo = document.getElementById('articulo').value,
        cantidad = document.getElementById('cantidad').value,
        nota = document.getElementById('nota').value,
        imagen = document.getElementById('imagen').value;

    db.collection("compras").add({
        articulo: articulo,
        cantidad: cantidad,
        nota: nota,
        imagen: imagen,
    })
        .then((docRef) => {
            console.log("Document written with ID: ", docRef.id);

            document.getElementById('articulo').value = '';
            document.getElementById('cantidad').value = '';
            document.getElementById('nota').value = '';
            document.getElementById('imagen').value = '';
            /**Limpia la Galeria*/
            document.getElementById('gallery').innerHTML = "";

        })
        .catch((error) => {
            console.error("Error adding document: ", error);
        });
}

// Creamos una var de donde queremos pintar la tabla
var table = document.getElementById('table');

// LEER Documentos

//  UPDATE en Tiempo Real
/** Cambios 
 * Remplaza get()  por onSnapshot()
 * Se Elimina .get().then((querySnapshot)...) y queda .onSnapshot((querySnapshot)...) 
 */

db.collection("compras").onSnapshot((querySnapshot) => {
    table.innerHTML = "";
    querySnapshot.forEach((doc) => {
        console.log(`${doc.id} => ${doc.data().articulo}`);
        table.innerHTML += `
        <tr>
        <td>${doc.data().articulo}</td>
        <td>${doc.data().cantidad}</td>
        <td>${doc.data().nota}</td>
        </tr>
        <tr>
        <td><img src="${doc.data().imagen}" alt="${doc.data().imagen}"></td>
        <td><button class="btn btn-warning" onclick="editar('${doc.id}','${doc.data().articulo}','${doc.data().cantidad}','${doc.data().nota}')">Editar</button></td>
        <td><button class="btn btn-danger" onclick="eliminar('${doc.id}')">Eliminar</button></td>
        </tr>`
    });
});

// BORRAR documentos
function eliminar(id) {
    db.collection("compras").doc(id).delete().then(() => {
        console.log("Document successfully deleted!");
    }).catch((error) => {
        console.error("Error removing document: ", error);
    });
}

// EDITAR documento
function editar(id, articulo, cantidad, nota) {
    // Escribe en los campos los valores del renglon seleccionado
    document.getElementById('articulo').value = articulo;
    document.getElementById('cantidad').value = cantidad;
    document.getElementById('nota').value = nota;
    var boton = document.getElementById('boton');
    // Reemplaza "GUARDAR" por "EDITAR" en hot
    boton.innerHTML = 'Guardar cambios';

    // Crea una funcion anonima para ejecutar cuando se haga click
    boton.onclick = function () {
        // El ID no va a cambiar
        var compraRef = db.collection("compras").doc(id);
        // Capturar los cambios en los Textfield si los hubo
        var articuloEditado = document.getElementById('articulo').value;
        var cantidadEditada = document.getElementById('cantidad').value;
        var notaEditada = document.getElementById('nota').value;

        // realiza la actualizacion
        return compraRef.update({
            articulo: articuloEditado,
            cantidad: cantidadEditada,
            nota: notaEditada
        })
            .then(() => {
                console.log("Document successfully updated!");
                // Si exito Regresa al boton su nombre original "Guardar"
                boton.innerHTML = 'Agregar a la lista';
                // Limpia los campos
                document.getElementById('articulo').value = '';
                document.getElementById('cantidad').value = '';
                document.getElementById('nota').value = '';
            })
            .catch((error) => {
                // The document probably doesn't exist.
                console.error("Error updating document: ", error);
            });
    }

}


function uploadImage() { }



'use strict'

var mongoose = require('mongoose');
var app = require('./app');
var port = 3800;

// Conexion Datavase
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/curso_mean_social', { useNewUrlParser: true , useUnifiedTopology: true})
        .then(() => {
            console.log("Conexion exitosa");

            // Crear servidor
            app.listen(port, () => {
                console.log("Servidor corriendo en http://localhost:3800");
            });

        })
        .catch(console.error());
'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var Publication = require('../models/publication');
var User = require('../models/user');
var Follow = require('../models/follow');

function probando(req, res) {
    res.status(200).send({
        message: "Hola desde el controlador de publicaciones"
    });
}

function savePublication(req, res) {
    var params = req.body;

    if (!params.text) return res.status(200).send({ message: 'Debes enviar un texto!!' });

    var publication = new Publication();
    publication.text = params.text;
    publication.file = 'null';
    publication.user = req.user.sub;
    publication.created_at = moment().unix();

    publication.save((err, publicationStored) => {
        if (err) return res.status(500).send({ message: 'Error al guardar la publicacion' });

        if (!publicationStored) return res.status(500).send({ message: 'la publicacion no ha sido guardada' });

        return res.status(200).send({ publication: publicationStored });

    })
}

function getPublications(req, res) {
    var page = 1;

    if (req.params.page) {
        page = req.params.page;
    }

    var itemsPerPage = 4;

    Follow.find({ user: req.user.sub }).populate('followed').exec((err, follows) => {
        if (err) return res.status(500).send({ message: 'Error al devolver el seguimiento' });

        var follows_clean = [];

        follows.forEach((follow) => {
            follows_clean.push(follow.followed);
        });

        follows_clean.push(req.user.sub);

        Publication.find({ user: { "$in": follows_clean } }).sort('-created_at').populate('user').paginate(page, itemsPerPage, (err, publications, total) => {
            if (err) return res.status(500).send({ message: 'Error al devolver publicaciones' });

            if (!publications) return res.status(404).send({ message: 'No hay publicaciones' });

            return res.status(200).send({
                total_items: total,
                pages: Math.ceil(total / itemsPerPage),
                page: page,
                items_per_page: itemsPerPage,
                publications
            });
        });
    });
}

function getPublicationsUser(req, res) {
    var page = 1;

    if (req.params.page) {
        page = req.params.page;
    }

    var user = req.user.sub;
    if(req.params.user){
        user = req.params.user
    }

    var itemsPerPage = 4;

    Publication.find({ user: user }).sort('-created_at').populate('user').paginate(page, itemsPerPage, (err, publications, total) => {
        if (err) return res.status(500).send({ message: 'Error al devolver publicaciones' });

        if (!publications) return res.status(404).send({ message: 'No hay publicaciones' });

        return res.status(200).send({
            total_items: total,
            pages: Math.ceil(total / itemsPerPage),
            page: page,
            items_per_page: itemsPerPage,
            publications
        });
    });
}

function getPublication(req, res) {
    var publicationId = req.params.id;

    Publication.findById(publicationId, (err, publication) => {
        if (err) return res.status(500).send({ message: 'Error al devolver la publicacion' });

        if (!publication) return res.status(404).send({ message: 'No existe publicacion' });

        return res.status(200).send({ publication });
    });
}

function deletePublication(req, res) {
    var publicationId = req.params.id;
    //deleteOne or remove
    Publication.find({ 'user': req.user.sub, '_id': publicationId }).deleteOne((err) => {
        if (err) return res.status(500).send({ message: 'Error al eliminar la publicacion' });

        return res.status(200).send({ message: 'Publicacion Eliminada correctamente' });
    })
}

//Subir archivos de imagen/avatar publicacion
function uploadImage(req, res) {
    var publicationId = req.params.id;

    if (req.files) {
        var file_path = req.files.image.path;

        var file_split = file_path.split('\\');

        var file_name = file_split[2];

        var ext_split = file_name.split('\.');
        var file_ext = ext_split[1];

        if (file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif') {

            Publication.findOne({ 'user': req.user.sub, '_id': publicationId }).exec((err, publication) => {

                if (publication) {
                    //actualizar dpcumento de usuario logueado
                    Publication.findByIdAndUpdate(publicationId, { file: file_name }, { new: true }, (err, publicationUpdated) => {
                        if (err) return res.status(500).send({ message: 'Error en la peticion' });

                        if (!publicationUpdated) return res.status(404).send({ message: 'No se ha podido actualizar el usuario' });

                        return res.status(200).send({ publication: publicationUpdated });
                    });
                } else {
                    return removeFilesOfUploads(res, file_path, 'No tienes permiso para actualizar la publicacion');
                }
            });


        } else {
            return removeFilesOfUploads(res, file_path, 'Extension no valida');
        }

    } else {
        return res.status(200).send({ message: 'No se han subido imagenes' });
    }
}

function removeFilesOfUploads(res, file_path, message) {
    fs.unlink(file_path, (err) => {
        return res.status(200).send({ message: message });
    });
}

//devolver imagen usuario
function getImageFile(req, res) {
    var image_file = req.params.imageFile;
    var path_file = './uploads/publications/' + image_file;

    fs.exists(path_file, (exists) => {
        if (exists) {
            res.sendFile(path.resolve(path_file));
        } else {
            res.status(200).send({ message: 'No existe la imagen...' });
        }
    });

}

module.exports = {
    probando,
    savePublication,
    getPublications,
    getPublicationsUser,
    getPublication,
    deletePublication,
    uploadImage,
    getImageFile
}
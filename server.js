'use-strict'
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 80;

let productos = JSON.parse(fs.readFileSync('productos.json'));
let cuentas = JSON.parse(fs.readFileSync('cuentas.json'));
let jsonParser = bodyParser.json();


app.use(cors());
app.use(jsonParser);
app.use('',logMiddleware);

app.route('/productos')
.get((req, res) => {
    let marcaQuery = req.query.marca;
    if(marcaQuery != undefined){
        let result = [];
        productos.forEach((e) => {
            if(e.marca == marcaQuery){
                result.push(e);
            }
        });
        res.json(result);
    }else{
        res.json(productos); 
    }
    res.json(result);
}).post(authMiddleWare, (req, res) => {
    let body = req.body;
    if(!(body.nombre && body.marca && body.precio && body.descripcion && body.existencia)){
        return res.status(400).json({error:"Faltan atributos"});
    }
    if(!(parseInt(body.precio) > -1)){
        return res.status(400).json({error:"El precio no cumple con el formato"});
    }
    if(!(parseInt(body.existencia) > -1)){
        return res.status(400).json({error:"La existencia no cumple con el formato"});
    }
    let id = parseInt(productos[(productos.length)-1].id)+1+"";
    let nuevoProducto = {"id":id, "nombre":body.nombre, "marca":body.marca, "precio":body.precio, "descripcion":body.descripcion, "existencia":body.existencia};
    productos.push(nuevoProducto);
    return res.status(201).json(nuevoProducto);
});
app.route('/productos/:id')
.get((req, res) => {
    let id = req.params.id;
    let index = null;
    productos.forEach((e, i) => {
        if(e.id == id){
            index = i;
        }
    });
    if(index != null){
        return res.json(productos[index]); 
    }else{
        return res.status(400).json({error:"Articulo no encontrado"});
    }
}).patch(authMiddleWare, (req, res) => {
    let body = req.body;
    let id = req.params.id;
    let index = null;
    productos.forEach((e, i) => {
        if(e.id == id){
            index = i;
        }
    });
    if(index == null){
        return res.status(400).json({error:"Articulo no encontrado"});
    }
    if(body.precio || body.existencia){
        if(!(parseInt(body.precio)>-1)){
            return res.status(400).json({error:"El precio no cumple con el formato"});
        }
        if(!(parseInt(body.existencia)>-1)){
            return res.status(400).json({error:"La existencia no cumple con el formato"});
        }
    }
    if(body.nombre){
        productos[index].nombre = body.nombre;
    }
    if(body.marca){
        productos[index].marca = body.marca;
    }
    if(body.precio){
        productos[index].precio = body.precio;
    }
    if(body.descripcion){
        productos[index].descripcion = body.descripcion;
    }
    if(body.existencia){
        productos[index].existencia = body.existencia;
    }
    return res.json(productos[index]);
});
app.post('/usuario/login', (req, res) => {
    let body = req.body;
    let index = null;
    if(!(body.usuario && body.password)){
        return res.status(400).json({error:"Faltan atributos"});
    }
    if(!(body.password.length > 5)){
        return res.status(400).json({error:"El formato de los atributos es incorrecto"});
    }
    cuentas.forEach((e,i) => {
        if(e.usuario == body.usuario){
            index = i;
        }
    });
    if(index == null){
        return res.status(400).json({error:"El usuario es incorrecto"});
    }
    if(cuentas[index].password != body.password){
        return res.status(400).json({error:"La contraseña es incorrecta"});
    }
    let token = createToken();
    let time = new Date();
    time.setMinutes(time.getMinutes() + 5);
    cuentas[index].token = createToken();
    cuentas[index].validThru = time;
    res.set('x-auth', cuentas[index].token);
    return res.status(200).json({"usuario":cuentas[index].usuario});
});
app.post('/usuario/logout', authMiddleWare, (req, res) => {
    let token = req.headers['x-auth'];
    let usuario = req.headers['x-user']
    cuentas.forEach((e, i) => {
        if(e.usuario == usuario && e.token == token){
            let time = new Date();
            time.setMinutes(time.getMinutes() - 5);
            cuentas[i].validThru = time;
            cuentas[i].token = "";
        }
    });
    return res.status(200).send();
});
app.listen(port);

function createToken() {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < 10; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }
 function logMiddleware(req, res, next){
    console.log("-----Nueva consulta----");
    console.log("Metodo: "+ req.method);
    console.log("Headers: Content-type:"+ req.get('Content-Type')+", x-auth:"+ req.get('x-auth'));
    console.log("URL: "+ req.originalUrl);
    console.log("Fecha: "+ new Date(Date.now()).toString());
    console.log("-----Fin de la consulta----\n");
    next();
 }
 function authMiddleWare(req, res, next){
    let token = req.headers['x-auth'];
    let usuario = req.headers['x-user'];
    let time = new Date();
    cuentas.forEach((e) => {
        if(e.usuario == usuario && e.token == token){
            if(time <= e.validThru){
                next();
            }
        }
    });
    return res.status(401).send();
 }

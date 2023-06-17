require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require("multer");
const bcrypt = require("bcrypt");
const File = require("./models/file");
const ejs = require("ejs");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
const upload = multer({ dest: "uploads" });

mongoose.connect('mongodb://127.0.0.1:27017/filesDB', { useNewUrlParser: true })
    .then(() => {
        console.log('Connected to MongoDB');
    }).catch(error => {
        console.error('Error connecting to MongoDB:', error);
    });

app.get('/', (req, res) => {
    res.render('index', { filelink: null });
})

app.post("/upload", upload.single("file"), async (req, res) => {
    const fileData = {
        path: req.file.path,
        name: req.file.originalname
    }
    if (req.body.password != null && req.body.password != "") {
        fileData.password = await bcrypt.hash(req.body.password, 5);
    }
    const file = await File.create(fileData);
    res.render("index", { filelink: `${req.headers.origin}/file/${file._id}` });
})

app.route("/file/:id").get(handleDownload).post(handleDownload);

async function handleDownload(req, res) {
    const file = await File.findById(req.params.id);
    if (file.password != null) {
        if(req.body.password==null){
            res.render("password", { status: null});
            return;
        }
        else if ((await bcrypt.compare(req.body.password, file.password))) {
            file.downloadCount++;
            await file.save();
            res.download(file.path, file.name);
        } else {
            res.render("password", { status: "Incorrect Password" });
        }
    } else {
        file.downloadCount++;
        await file.save();
        res.download(file.path, file.name);
    }
}


app.listen(8080, function () {
    console.log('Server started on port 8080');
});
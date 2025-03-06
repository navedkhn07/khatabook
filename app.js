const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.get("/",(req, res)=>{
    res.send("Honey❤️");
})

app.get('/home',(req, res)=>{
    fs.readdir(`./files`, function(err, files){
    res.render('home',{files});

    });
});

app.get('/hisaab/:filename',(req, res)=>{
    fs.readFile(`./files/${req.params.filename}`, "utf8", function(err, data){
        if(err) return res.send(err);
        res.render('hisaab',{data,filename:req.params.filename})
    })
});

app.get('/edit/:filename',(req, res)=>{
    fs.readFile(`./files/${req.params.filename}`, "utf8", function(err, data){
        if(err) return res.send(err);
        res.render('edit',{data,filename:req.params.filename})
    })
});

app.post('/update/:filename',(req, res)=>{
    fs.writeFile(`./files/${req.params.filename}`, req.body.filedata , function(err, data){
        if(err) return res.send(err);
        res.redirect("/home")
    })
});

app.get('/delete/:filename',(req, res)=>{
    fs.unlink(`./files/${req.params.filename}`, function(err, data){
        if(err) return res.send(err);
        res.redirect("/home",);
    })
});

app.get("/create", function(req,res){
    res.render("create");
})

app.post('/create',(req, res)=>{
    fs.writeFile(`./files/${req.body.title}`, req.body.filedata, function(err){
        if(err) return res.status(500).send(err);
        res.redirect("/home");
    })
});

app.get("/createByTime", function(req,res){
    res.render("createByTime");
})

app.post('/createByTime',(req, res)=>{
    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    fs.writeFile(`./files/${formattedDate}.txt`, req.body.filedata, function(err) {
        if (err) {
            res.status(500).send(err);
        } else {
            res.redirect("/home");
        }
    });
});
app.get('/hisaab', (req, res) => {
    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    fs.writeFile(`./files/${formattedDate}.txt`, "Daal chawal noodles", function(err) {
        if (err) {
            console.log("Something went wrong");
            res.status(500).send("Error creating file");
        } else {
            console.log("Hisaab Created");
            res.send("Hisaab created successfully");
        }
    });
});

app.listen(3000);
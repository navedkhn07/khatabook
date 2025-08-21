const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Hisaab = require('./models/Hisaab');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/khatabook';

// MongoDB connection options for cloud deployment
const mongooseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // 30 seconds
    socketTimeoutMS: 45000, // 45 seconds
    maxPoolSize: 10,
    minPoolSize: 1,
    maxIdleTimeMS: 30000,
    retryWrites: true,
    w: 'majority'
};

mongoose
    .connect(MONGODB_URI, mongooseOptions)
    .then(() => console.log('MongoDB connected successfully'))
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit if cannot connect to database
    });

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
});

// Sessions
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'devsecret',
        resave: false,
        saveUninitialized: false
    })
);

// Expose user to templates
app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    next();
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

function ensureAuth(req, res, next) {
    if (!req.session.user) return res.redirect('/login');
    next();
}

// app.get("/",(req, res)=>{
//     res.send("Honey❤️");
// })

// Simple root endpoint for Render health check
app.get('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    // If user is logged in, redirect to dashboard
    res.redirect('/dashboard');
});

app.get('/dashboard', ensureAuth, async (req, res) => {
    try {
        // Check if MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
            return res.status(500).send('Database connection not available. Please try again.');
        }
        
        const hisaabs = await Hisaab.find({ user: req.session.user._id }).sort({ createdAt: -1 }).maxTimeMS(10000);
        res.render('home', { hisaabs });
    } catch (err) {
        console.error('Home route error:', err);
        if (err.name === 'MongoServerSelectionError' || err.message.includes('buffering timed out')) {
            return res.status(500).send('Database connection timeout. Please try again.');
        }
        res.status(500).send('Failed to load data. Please try again.');
    }
});

app.get('/hisaab/:id', ensureAuth, async (req, res) => {
    try {
        const doc = await Hisaab.findOne({ _id: req.params.id, user: req.session.user._id });
        if (!doc) return res.status(404).send('Not found');
        res.render('hisaab', { id: String(doc._id), title: doc.title, content: doc.content });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/edit/:id', ensureAuth, async (req, res) => {
    try {
        const doc = await Hisaab.findOne({ _id: req.params.id, user: req.session.user._id });
        if (!doc) return res.status(404).send('Not found');
        res.render('edit', { id: String(doc._id), title: doc.title, data: doc.content });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/update/:id', ensureAuth, async (req, res) => {
    try {
        await Hisaab.updateOne(
            { _id: req.params.id, user: req.session.user._id },
            { $set: { title: req.body.title || 'Untitled', content: req.body.filedata || '' } }
        );
        res.redirect('/');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/delete/:id', ensureAuth, async (req, res) => {
    try {
        await Hisaab.deleteOne({ _id: req.params.id, user: req.session.user._id });
        res.redirect('/');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get("/create", ensureAuth, function(req,res){
    res.render("create");
})

app.post('/create', ensureAuth, async (req, res) => {
    try {
        await Hisaab.create({ title: req.body.title || 'Untitled', content: req.body.filedata || '', user: req.session.user._id });
        res.redirect('/');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get("/createByTime", ensureAuth, function(req,res){
    res.render("createByTime");
})

app.post('/createByTime', ensureAuth, async (req, res) => {
    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;
    try {
        await Hisaab.create({ title: `${formattedDate}.txt`, content: req.body.filedata || '', user: req.session.user._id });
        res.redirect('/');
    } catch (err) {
        res.status(500).send(err.message);
    }
});
// Auth routes
app.get('/register', (req, res) => res.render('register'));
app.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
            return res.status(500).send('Database connection not available. Please try again.');
        }
        
        const existing = await User.findOne({ email }).maxTimeMS(10000); // 10 second timeout
        if (existing) return res.status(400).send('Email already registered');
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, passwordHash });
        req.session.user = { _id: user._id, name: user.name, email: user.email };
        res.redirect('/');
    } catch (err) {
        console.error('Registration error:', err);
        if (err.name === 'MongoServerSelectionError' || err.message.includes('buffering timed out')) {
            return res.status(500).send('Database connection timeout. Please try again.');
        }
        res.status(500).send('Registration failed. Please try again.');
    }
});
app.get('/login', (req, res) => res.render('login'));
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Check if MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
            return res.status(500).send('Database connection not available. Please try again.');
        }
        
        const user = await User.findOne({ email }).maxTimeMS(10000); // 10 second timeout
        if (!user) return res.status(400).send('Invalid credentials');
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(400).send('Invalid credentials');
        req.session.user = { _id: user._id, name: user.name, email: user.email };
        res.redirect('/');
    } catch (err) {
        console.error('Login error:', err);
        if (err.name === 'MongoServerSelectionError' || err.message.includes('buffering timed out')) {
            return res.status(500).send('Database connection timeout. Please try again.');
        }
        res.status(500).send('Login failed. Please try again.');
    }
});
app.post('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
});

const PORT = process.env.PORT || 3000;
if (process.env.VERCEL) {
	module.exports = app;
} else {
	app.listen(PORT, '0.0.0.0', () => {
		console.log(`🚀 Server is running on port ${PORT}`);
		console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
		console.log(`🔗 MongoDB URI: ${MONGODB_URI ? 'Set' : 'Not set'}`);
		console.log(`📊 MongoDB Status: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
	});
}
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

import User from './server/models/User.js';
import Item from './server/models/Item.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
const imagesDirectory = path.join(__dirname, 'public', 'images');

// Keep uploaded images in memory until their content has been checked.
const itemImageUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
        fields: 4
    }
});

// Parse request bodies and serve frontend assets.
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public/html')));

// Serve a page by its name, such as /itemInsert or /register.
app.get('/:page', (req, res, next) => {
    const page = req.params.page;
    const filePath = path.join(__dirname, 'public/html', `${page}.html`);

    res.sendFile(filePath, (err) => {
        if (err) next();
    });
});

// The homepage is stored inside public/html rather than at the public root.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html', 'index.html'));
});

// Create a user account after checking the required fields and email uniqueness.
app.post('/api/register', async (req, res) => {
    try {
        const { fname, lname, email, password } = req.body;

        if (!fname || !lname || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        await User.create({
            fname,
            lname,
            email,
            password: passwordHash
        });

        res.status(201).json({ message: 'User saved successfully' });
    } catch (error) {
        console.error('Failed to save user:', error);
        res.status(500).json({ error: 'Failed to save user' });
    }
});

// Identify supported image formats from their binary signatures, not the client MIME type.
function getImageExtension(buffer) {
    if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
        return '.png';
    }
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return '.jpg';
    }
    if (
        buffer.toString('ascii', 0, 4) === 'RIFF' &&
        buffer.toString('ascii', 8, 12) === 'WEBP'
    ) {
        return '.webp';
    }
    return null;
}

// List saved items for the storefront.
app.get('/api/items', async (req, res) => {
    try {
        const items = await Item.find().sort({ _id: -1 }).lean();
        res.json({
            items: items.map((item) => ({
                id: item._id.toString(),
                name: item.name,
                pictureName: item.pictureName,
                description: item.description,
                price: item.price
            }))
        });
    } catch (error) {
        console.error('Failed to retrieve items:', error);
        res.status(500).json({ error: 'Failed to retrieve items' });
    }
});

// Save the uploaded image and its item details.
app.post('/api/items', (req, res, next) => {
    itemImageUpload.single('picture')(req, res, (error) => {
        if (error) {
            return next(error);
        }
        next();
    });
}, async (req, res) => {
    let savedImagePath;

    try {
        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
            return res.status(400).json({ error: 'Item details are required' });
        }

        const { name, description, price } = req.body;

        if (
            typeof name !== 'string' || !name.trim() ||
            typeof description !== 'string' || !description.trim() ||
            name.trim().length > 100 ||
            description.trim().length > 1000 ||
            price === undefined || price === null || price === ''
        ) {
            return res.status(400).json({
                error: 'Provide an item name, description, image, and valid price within the field limits'
            });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Please choose an item image' });
        }

        const imageExtension = getImageExtension(req.file.buffer);
        if (!imageExtension) {
            return res.status(400).json({ error: 'Image must be a valid PNG, JPEG, or WebP file' });
        }

        const numericPrice = Number(price);
        if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
            return res.status(400).json({ error: 'Price must be a number greater than zero' });
        }

        const pictureName = `${randomUUID()}${imageExtension}`;
        const imagePath = path.join(imagesDirectory, pictureName);
        await mkdir(imagesDirectory, { recursive: true });
        await writeFile(imagePath, req.file.buffer, { flag: 'wx' });
        savedImagePath = imagePath;

        const item = await Item.create({
            name: name.trim(),
            pictureName,
            description: description.trim(),
            price: numericPrice
        });

        res.status(201).json({
            message: 'Item saved successfully',
            item
        });
    } catch (error) {
        if (savedImagePath) {
            try {
                await unlink(savedImagePath);
            } catch (cleanupError) {
                if (cleanupError.code !== 'ENOENT') {
                    console.error('Failed to remove unused uploaded image:', cleanupError);
                }
            }
        }
        console.error('Failed to save item:', error);
        res.status(500).json({ error: 'Failed to save item' });
    }
});

// Return clear errors for multipart upload limits and invalid form data.
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        return res.status(status).json({ error: 'Image upload failed: ' + error.message });
    }
    next(error);
});

// Verify the user's password and return a signed login token.
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user || !password) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: `${user.fname} ${user.lname}`,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Failed to log in:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Return user profiles without exposing stored password hashes.
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().select('-password').lean();
        res.json(users);
    } catch (error) {
        console.error('Failed to retrieve users:', error);
        res.status(500).json({ error: 'Failed to retrieve users' });
    }
});

// Simple endpoint for checking that the API is reachable.
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

// Connect to MongoDB before accepting requests.
async function startServer() {
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is not set in the .env file');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer().catch((error) => {
    console.error('Could not start server:', error);
    process.exitCode = 1;
});

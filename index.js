const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(bodyParser.json());

// JWT secret key
const secretKey = process.env.SECRET_KEY;

// Middleware for authenticating JWT token
function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token verification failed' });
    }

    req.user = user;
    next();
  });
}

// Middleware for validating vehicle tax input
function validateVehicleTaxInput(req, res, next) {
  const { name, number, price} = req.body;

  if (!name || !number || !price) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // You can add additional validation logic here if needed

  next();
}

// Get all vehicle taxes
app.get('/vehicle-taxes', async (req, res) => {
  const vehicleTaxes = await prisma.vehicleTax.findMany();
  res.json(vehicleTaxes);
});

// Get a single vehicle tax by ID
app.get('/vehicle-taxes/:id', async (req, res) => {
  const { id } = req.params;
  const vehicleTax = await prisma.vehicleTax.findUnique({ where: { id: Number(id) } });

  if (!vehicleTax) {
    return res.status(404).json({ error: 'Vehicle tax not found' });
  }

  res.json(vehicleTax);
});

// Create a new vehicle tax
app.post('/vehicle-taxes', authenticateToken, validateVehicleTaxInput, async (req, res) => {
  const { name, number, price} = req.body;

  const newVehicleTax = await prisma.vehicleTax.create({
    data: { name, number, price},
  });

  res.json(newVehicleTax);
});

// Update a vehicle tax by ID
app.put('/vehicle-taxes/:id', authenticateToken, validateVehicleTaxInput, async (req, res) => {
  const { id } = req.params;
  const { name, number, price} = req.body;

  const updatedVehicleTax = await prisma.vehicleTax.update({
    where: { id: Number(id) },
    data: { name, number, price},
  });

  res.json(updatedVehicleTax);
});

// Delete a vehicle tax by ID
app.delete('/vehicle-taxes/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  await prisma.vehicleTax.delete({ where: { id: Number(id) } });

  res.json({ message: 'Vehicle tax deleted successfully' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(8080, () => {
  console.log('Server is running on http://localhost:8080');
});

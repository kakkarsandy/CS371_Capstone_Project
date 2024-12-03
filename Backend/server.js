require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 8000;


const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  }
});

app.use(express.json()); 

app.get('/data', async (req, res) => {
  try {
    const query = 'SELECT * FROM financial_data ORDER BY date';
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Server error');
  }
});

app.post('/data', async (req, res) => {
  const { date, spy, gld, amzn, goog, kpti, gild, mpc } = req.body;

  const query = `
    INSERT INTO financial_data (date, spy, gld, amzn, goog, kpti, gild, mpc)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`;

  const values = [date, spy, gld, amzn, goog, kpti, gild, mpc];

  try {
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Server error');
  }
});

app.put('/data/:date', async (req, res) => {
  const { date } = req.params;
  const { spy, gld, amzn, goog, kpti, gild, mpc } = req.body;

  const query = `
    UPDATE financial_data
    SET spy = $1, gld = $2, amzn = $3, goog = $4, kpti = $5, gild = $6, mpc = $7
    WHERE date = $8
    RETURNING *`;

  const values = [spy, gld, amzn, goog, kpti, gild, mpc, date];

  try {
    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      res.status(404).send('Record not found');
    } else {
      res.status(200).json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Server error');
  }
});

app.delete('/data/:date', async (req, res) => {
  const { date } = req.params;

  const query = 'DELETE FROM financial_data WHERE date = $1 RETURNING *';

  try {
    const result = await pool.query(query, [date]);
    if (result.rowCount === 0) {
      res.status(404).send('Record not found');
    } else {
      res.status(200).json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Server error');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

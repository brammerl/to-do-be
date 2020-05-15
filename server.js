require('dotenv').config();

const client = require('./lib/client');

// Initiate database connection
client.connect();

const app = require('./lib/app');

const PORT = process.env.PORT || 7890;
const ensureAuth = require('./lib/auth/ensure-auth');
const createAuthRoutes = require('./lib/auth/create-auth-routes');

const authRoutes = createAuthRoutes({
  selectUser(email) {
    return client.query(`
          SELECT id, email, hash
          FROM users
          WHERE email = $1;
      `,
    [email]
    ).then(result => result.rows[0]);
  },
  insertUser(user, hash) {
    console.log(user);
    return client.query(`
          INSERT into users (email, hash)
          VALUES ($1, $2)
          RETURNING id, email;
      `,
    [user.email, hash]
    ).then(result => result.rows[0]);
  }
});

app.use('/auth', authRoutes);
app.use('/api', ensureAuth);

app.get('/api/todo', async(req, res) => {
  const data = await client.query(`
    SELECT * from todo where user_id=$1
  `, [req.userId]);

  res.json(data.rows);
});

app.post('/api/todo', async(req, res) => {
  const data = await client.query(`
    INSERT INTO todo (task, completed, user_id)
    VALUES ($1, $2, $3)
    returning*;
  `, 
  [req.body.task, false, req.userId]);

  res.json(data.rows[0]);
});

app.put('/api/todo/:id', async(req, res) => {
  const id = req.params.id;
  const data = await client.query(`
    UPDATE todo 
    SET completed=$1
    WHERE todo.id=$2 AND user_id=$3
    returning*;
  `, [true, id, req.userId]);

  res.json(data.rows);
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Started on ${PORT}`);
});

module.exports = app;

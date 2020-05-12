const client = require('../lib/client');
// import our seed data:
const todo = require('./todo.js');
const usersData = require('./users.js');

run();

async function run() {

  try {
    await client.connect();

    const users = await Promise.all(
      usersData.map(user => {
        return client.query(`
                      INSERT INTO users (email, hash, username)
                      VALUES ($1, $2, $3)
                      RETURNING *;
                  `,
        [user.email, user.hash, user.username]);
      })
    );
      
    const user = users[0].rows[0];

    await Promise.all(
      todo.map(animal => {
        return client.query(`
                    INSERT INTO todo (task, completed, user_id)
                    VALUES ($1, $2, $3);
                `,
        [animal.task, animal.completed, user.id]);
      })
    );
    

    console.log('seed data load complete');
  }
  catch(err) {
    console.log(err);
  }
  finally {
    client.end();
  }
    
}

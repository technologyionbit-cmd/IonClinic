// run -------> npx tsx seed.ts
import db from './database.js';
import bcrypt from 'bcryptjs';

const seedUsers = () => {
  console.log('🌱 Seeding default users...');

  const defaultPassword = '123456';
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(defaultPassword, salt);

  const users = [
    { username: 'admin', role: 'Admin' },
    { username: 'doctor', role: 'Doctor' },
    { username: 'secretary', role: 'Secretary' }
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, role) 
    VALUES (?, ?, ?)
  `);

  // Use a transaction to insert all users safely
  const seedTransaction = db.transaction((usersToInsert) => {
    for (const user of usersToInsert) {
      try {
        insertUser.run(user.username, hashedPassword, user.role);
        console.log(`✅ Created user: ${user.username} (Role: ${user.role})`);
      } catch (err: any) {
        // Ignore UNIQUE constraint errors if users already exist
        if (err.message.includes('UNIQUE constraint failed')) {
          console.log(`⚠️ User ${user.username} already exists, skipping.`);
        } else {
          console.error('Error inserting user:', err);
        }
      }
    }
  });

  seedTransaction(users);
  console.log('🎉 Database seeding complete!');
};

seedUsers();
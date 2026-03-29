import type { Request, Response } from 'express';
import db from '../database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const login = (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user: any = stmt.get(username);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // INJECT ROLE INTO JWT PAYLOAD
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role }, 
      process.env.JWT_SECRET || 'secret',
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminChangeUserPassword = async (req: Request, res: Response) => {
  const { username, newPassword } = req.body;

  if (!username || !newPassword) {
    return res.status(400).json({ message: 'Username and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  try {
    // 1. Securely hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 2. Update the password in the database for the specific user
    const stmt = db.prepare('UPDATE users SET password_hash = ? WHERE username = ?');
    const info = stmt.run(hashedPassword, username);

    // 3. Check if the user actually exists
    if (info.changes === 0) {
      return res.status(404).json({ message: `Account for '${username}' not found.` });
    }

    res.json({ message: `Password for ${username} updated successfully!` });
  } catch (error) {
    console.error('Admin Change Password Error:', error);
    res.status(500).json({ message: 'Error updating password.' });
  }
};
import React, { useState } from 'react';
import styles from './styles/login.module.css';

export default function Login({user, login, createUser}) {
  const [mode, setMode] = useState('display');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const loginClicked = (e) => {
    e.preventDefault();
    login({
      username,
      password,
    });
    
    cancelForm();
  };

  const createUserClicked = (e) => {
    e.preventDefault();
    if (password === confirmPassword) {
      createUser({
        username,
        password,
      });

      cancelForm();
    }
  };

  const cancelForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setMode('display');
  }

  if (mode === 'display') {
    if (user === null) {
      return (
        <div className={styles.buttons}>
          <button type="button" onClick={() => { setMode('login'); }}>Login</button>
          <button type="button" onClick={() => { setMode('create'); }}>Create User</button>
        </div>
      );
    }

    return (
      <div>
        <p>{user.username} logged in</p>
      </div>
    )
  }

  if (mode === 'login') {
    return (
      <div className="modal open">
        <form>
          <h1>Login</h1>
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)} 
          />
          <div className="buttons">
            <button type="button" onClick={cancelForm}>Cancel</button>
            <button type="submit" onClick={loginClicked}>Log in</button>
          </div>
        </form>
      </div>
    )
  }

  if (mode === 'create') {
    return (
      <div className="modal open">
        <form>
          <h1>Login</h1>
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label htmlFor="confirm-password">Confirm Password</label>
          <input
            type="password"
            id="confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <div className="buttons">
            <button type="button" onClick={cancelForm}>Cancel</button>
            <button type="submit" onClick={createUserClicked}>Log in</button>
          </div>
        </form>
      </div>
    )
  }

}
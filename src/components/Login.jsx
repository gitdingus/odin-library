import React, { useState } from 'react';

export default function Login({user}) {
  const [mode, setMode] = useState('login');

  const loginUser = () => {
    console.log('login user');
  };

  if (mode === 'login') {
    return (
      <div>
        <form noValidate>
          <label htmlFor="username">User: </label>
          <input type="text" id="username" />
          <label htmlFor="password">Password: </label>
          <input type="password" id="password" />
          <button type="submit" onClick={loginUser}>Login</button>
        </form>
      </div>
    )
  }
}
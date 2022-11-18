import React from 'react';
import { Link, Outlet } from "react-router-dom";
import '../App.css';

export function Root() {
  return (
    <div className="App">
      <nav>
        <h1><Link to="/">Algorand Polling Demo</Link></h1>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

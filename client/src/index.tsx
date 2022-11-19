import React from 'react';
import ReactDOM from 'react-dom/client';
import { createHashRouter, RouterProvider } from "react-router-dom";
import './index.css';
import reportWebVitals from './reportWebVitals';
import { Root, loader as rootLoader } from './routes/root';
import { Home, action as homeAction } from './routes/home';
import { Settings, loader as settingsLoader, action as settingsAction } from './routes/settings';
import { Poll, loader as pollLoader, action as pollAction } from './routes/poll';

const router = createHashRouter([
  {
    path: "/",
    id: "root",
    loader: rootLoader,
    element: <Root />,
    children: [
      {
        path: "/",
        element: <Home />,
        action: homeAction
      },
      {
        path: "/settings",
        loader: settingsLoader,
        action: settingsAction,
        element: <Settings />,
      },
      {
        path: "poll/:appID",
        loader: pollLoader,
        action: pollAction,
        element: <Poll />
      }
    ]
  },
]);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

import ReactDOM from 'react-dom/client';
import { router } from './router';
import { RouterProvider } from 'react-router-dom';
import './assets/index.css';
import { Provider } from 'react-redux';
import { store } from './store/store';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <Provider store={store}>
    <RouterProvider router={router} />
  </Provider >
);

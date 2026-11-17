import ReactDOM from 'react-dom/client';
import {App} from './App';

const root = document.getElementById('root')!;

addEventListener('load', () => {
  ReactDOM.createRoot(root).render(<App />);
});

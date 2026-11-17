import './title.css';
import {Image} from 'tinywidgets';

export const Title = () => (
  <h1 id="topBarTitle">
    <Image src="/favicon.svg" variant="logo" alt="TinyBase" />
    TinyBase Todos
  </h1>
);

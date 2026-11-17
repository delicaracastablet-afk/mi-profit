import './todoInput.css';
import {useState} from 'react';
import {useAddRowCallback, STORE_ID} from './Store';
import {todoInputText} from './todoInput.css.ts';
import {Button, TextInput} from 'tinywidgets';

export const TodoInput = () => {
  const [text, setText] = useState('');
  const addRow = useAddRowCallback(
    'todos',
    () => ({text: text.trim(), completed: false}),
    [text],
    STORE_ID,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      addRow();
      setText('');
    }
  };

  return (
    <form id="todoInput" onSubmit={handleSubmit}>
      <TextInput
        className={todoInputText}
        initialText={text}
        onChange={setText}
        placeholder="What needs to be done?"
      />
      <Button title="Add" variant="accent" />
    </form>
  );
};

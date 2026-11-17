import './todoItem.css';
import {
  useDelRowCallback,
  useRow,
  useSetPartialRowCallback,
  type TodoRow,
  STORE_ID,
} from './Store';
import {Button, Checkbox} from 'tinywidgets';

export const TodoItem = ({rowId}: {rowId: string}) => {
  const todo = useRow('todos', rowId, STORE_ID) as TodoRow;
  const setPartialRow = useSetPartialRowCallback(
    'todos',
    rowId,
    (e: React.ChangeEvent<HTMLInputElement>) => ({completed: e.target.checked}),
    [],
    STORE_ID,
  );
  const delRow = useDelRowCallback('todos', rowId, STORE_ID);

  return (
    <div className={`todoItem${todo.completed ? ' completed' : ''}`}>
      <Checkbox
        initialChecked={todo.completed}
        onChange={(completed) =>
          setPartialRow({
            target: {checked: completed},
          } as React.ChangeEvent<HTMLInputElement>)
        }
        alt={`Toggle ${todo.text}`}
      />
      <label htmlFor={`todo-${rowId}`}>{todo.text}</label>
      <Button title="Delete" onClick={delRow} />
    </div>
  );
};
